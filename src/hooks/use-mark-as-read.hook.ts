import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type { AckPacketBody } from '@/interfaces/protocol.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageCacheHelper } from '@/services/cache/message-cache-helper.service';
import type {
  MarkAsReadMeta,
  MarkAsReadResult,
} from '@/services/core/message.service';
import { MessageBuilder } from '@/services/messaging/message-builder.service';
import { messageQueue } from '@/services/messaging/message-queue.service';
import { useStrategy } from '@/store';

export interface MarkAsReadParams {
  conversationId: string;
  messageIds: Array<string | number>;
}

interface MessageQuerySnapshot {
  queryKey: readonly unknown[];
  data: MessagesQueryData;
}

interface MarkAsReadContext {
  conversationId: string;
  snapshots: MessageQuerySnapshot[];
}

interface MarkAsReadMutationResult {
  fallbackMessageIds: string[];
}

interface MessagesQueryData {
  pages: Array<{
    items: StandardMessage[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface AckEligibleCurrentUser {
  app?: string;
  pin?: string;
}

function isMessagesQueryData(data: unknown): data is MessagesQueryData {
  if (!data || typeof data !== 'object') return false;
  const value = data as Record<string, unknown>;
  if (!Array.isArray(value.pages)) return false;

  return value.pages.every((page) => {
    if (!page || typeof page !== 'object') return false;
    const items = (page as Record<string, unknown>).items;
    return Array.isArray(items);
  });
}

function isConversationMessagesQueryKey(
  queryKey: readonly unknown[],
  conversationId: string,
): boolean {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === queryKeys.messages.all[0] &&
    queryKey[1] === 'list' &&
    queryKey[2] === conversationId
  );
}

function getConversationMessageQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
): MessageQuerySnapshot[] {
  return queryClient
    .getQueriesData({
      queryKey: queryKeys.messages.lists(),
    })
    .flatMap(([queryKey, queryData]) => {
      if (
        Array.isArray(queryKey) &&
        isConversationMessagesQueryKey(queryKey, conversationId) &&
        isMessagesQueryData(queryData)
      ) {
        return [
          {
            queryKey,
            data: queryData,
          },
        ];
      }

      return [];
    });
}

function updateQueriesForMessages(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: MessageQuerySnapshot[],
  messageIds: Set<string>,
  status: MessageStatusEnum,
): void {
  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.queryKey, (oldData: unknown) => {
      if (!isMessagesQueryData(oldData)) {
        return oldData;
      }

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => {
            const messageId = String(item.id || item.tempId || '');
            const shouldUpdate =
              !!messageId &&
              messageIds.has(messageId) &&
              item.status !== status;

            return shouldUpdate ? { ...item, status } : item;
          }),
        })),
      };
    });
  }
}

function restoreQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: MessageQuerySnapshot[],
): void {
  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
  }
}

function buildAckPacketBody(
  message: StandardMessage,
  conversationId: string,
): AckPacketBody | null {
  const senderApp = message.sender.app;
  const senderPin = message.sender.pin;

  if (!senderApp || !senderPin) {
    console.warn('[markAsRead] Message missing sender info:', message.id);
    return null;
  }

  return {
    sender: message.sender.pin,
    app: message.sender.app,
    mid: message.id,
    chatId: conversationId,
    timestamp: Date.now(),
  };
}

function isSelfSentMessage(
  message: StandardMessage,
  currentUser: AckEligibleCurrentUser,
): boolean {
  const currentUserPin = currentUser.pin?.trim();

  if (!currentUserPin || message.sender.pin !== currentUserPin) {
    return false;
  }

  const currentUserApp = currentUser.app?.trim();

  if (!currentUserApp) {
    return true;
  }

  return message.sender.app === currentUserApp;
}

function extractMessagesToMark(
  querySnapshots: MessageQuerySnapshot[],
  targetIds: Set<string>,
  currentUser: AckEligibleCurrentUser,
): StandardMessage[] {
  const allMessages = querySnapshots.flatMap((snapshot) =>
    snapshot.data.pages.flatMap((page) => page.items),
  );

  return MessageCacheHelper.dedupeMessages(allMessages).filter((message) => {
    const messageId = String(message.id || message.tempId || '');
    return (
      !!messageId &&
      targetIds.has(messageId) &&
      !isSelfSentMessage(message, currentUser)
    );
  });
}

function resolveAckRequestId(
  result: MarkAsReadResult | undefined,
): string | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  return typeof result.ackRequestId === 'string' && result.ackRequestId
    ? result.ackRequestId
    : undefined;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();
  const { currentUser } = useStrategy();

  return useMutation<
    MarkAsReadMutationResult,
    unknown,
    MarkAsReadParams,
    MarkAsReadContext | undefined
  >({
    mutationFn: async (params: MarkAsReadParams) => {
      const { conversationId, messageIds } = params;
      const readMessageIds = new Set(messageIds.map(String));
      const supportsStrictAck = messageService.markAsRead.length >= 2;

      if (readMessageIds.size === 0) {
        return { fallbackMessageIds: [] };
      }

      const querySnapshots = getConversationMessageQueries(
        queryClient,
        conversationId,
      );

      if (querySnapshots.length === 0) {
        console.warn(
          '[markAsRead] Messages query data not found, skip remote ack',
          {
            conversationId,
            messageIds: Array.from(readMessageIds),
          },
        );
        return { fallbackMessageIds: [] };
      }

      const messagesToMark = extractMessagesToMark(
        querySnapshots,
        readMessageIds,
        currentUser,
      );
      const errors: Array<{ messageId: string; error: unknown }> = [];
      const fallbackMessageIds: string[] = [];

      for (const message of messagesToMark) {
        const messageId = String(message.id || message.tempId || '');
        const ackPacketBody = buildAckPacketBody(message, conversationId);

        if (!ackPacketBody) {
          if (messageId && supportsStrictAck) {
            fallbackMessageIds.push(messageId);
          }
          continue;
        }

        const requestId = MessageBuilder.generateUniqueId();
        const meta: MarkAsReadMeta = {
          requestId,
          conversationId,
          messageId,
          channelType: message.channelType,
        };

        messageQueue.enqueueReceiptAck({
          ackRequestId: requestId,
          conversationId,
          targetMessageId: messageId,
          targetTempId: message.tempId,
          channelType: message.channelType,
          targetStatus: MessageStatusEnum.Read,
          ackKind: 'read',
        });

        try {
          const result = await messageService.markAsRead(ackPacketBody, meta);
          const ackRequestId = resolveAckRequestId(result ?? undefined);

          if (ackRequestId) {
            void messageQueue.rekeyReceiptAck(requestId, ackRequestId);
            continue;
          }

          messageQueue.dequeue(requestId);

          if (supportsStrictAck) {
            fallbackMessageIds.push(messageId);
          }
        } catch (error) {
          messageQueue.dequeue(requestId);
          errors.push({ messageId, error });
        }
      }

      if (errors.length === messagesToMark.length && errors.length > 0) {
        throw new Error(
          `Failed to mark all messages as read: ${errors[0]?.error}`,
        );
      }

      if (errors.length > 0) {
        console.warn('[markAsRead] Partial failure:', errors);
      }

      return {
        fallbackMessageIds,
      };
    },
    onMutate: async (params) => {
      const { conversationId, messageIds } = params;
      if (messageIds.length === 0) {
        return undefined;
      }

      const supportsStrictAck = messageService.markAsRead.length >= 2;

      await queryClient.cancelQueries({
        predicate: (query) =>
          isConversationMessagesQueryKey(query.queryKey, conversationId),
      });

      const snapshots = getConversationMessageQueries(
        queryClient,
        conversationId,
      );
      const messagesToMark = extractMessagesToMark(
        snapshots,
        new Set(messageIds.map(String)),
        currentUser,
      );
      const eligibleMessageIds = new Set(
        messagesToMark.map((message) => String(message.id || message.tempId)),
      );

      if (!supportsStrictAck && eligibleMessageIds.size > 0) {
        updateQueriesForMessages(
          queryClient,
          snapshots,
          eligibleMessageIds,
          MessageStatusEnum.Read,
        );
      }

      return {
        conversationId,
        snapshots,
      };
    },
    onSuccess: (data, _params, context) => {
      if (!context || data.fallbackMessageIds.length === 0) {
        return;
      }

      updateQueriesForMessages(
        queryClient,
        context.snapshots,
        new Set(data.fallbackMessageIds),
        MessageStatusEnum.Read,
      );
    },
    onError: (error, params, context) => {
      if (error) {
        console.error('[use-mark-as-read] error: ', error);
        console.log('[use-mark-as-read] params: ', params);
      }
      if (!context) return;

      restoreQueries(queryClient, context.snapshots);
    },
  });
}
