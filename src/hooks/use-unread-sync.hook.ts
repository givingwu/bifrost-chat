import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { UnreadCountResult } from '@/services/core/conversation.service';
import { MessageSyncService } from '@/services/messaging/message-sync.service';
import { useStrategy } from '@/store';

function clampDeltaByBase(baseUnread: number, delta: number): number {
  const safeBase = Math.max(0, baseUnread ?? 0);
  const minDelta = -safeBase;
  return Math.max(minDelta, delta);
}

/**
 * 未读同步 Hook：库内订阅 IMessageService 的实时消息与状态更新，并直接维护会话缓存。
 *
 * @description
 * 挂载后订阅 messageService.subscribeToMessages / subscribeToMessageStatus：
 *
 * **新消息（incoming chat_message）**：
 * - 会话级：只维护按会话的未读增量映射 `+1`
 * - 渠道级：维护按渠道的未读增量映射 `+1`
 * - 说明：`Conversation.unreadCount` 视为服务端基线，不在实时流中修改
 *
 * **已读回执（status === Read）**：
 * - 会话级：只维护按会话的未读增量映射 `-1`
 * - 渠道级：维护按渠道的未读增量映射 `-1`
 * - 展示值通过 `max(0, base + delta)` 保证不为负
 *
 * 使用 DefaultChatLayout 时会在布局内自动调用本 Hook；自定义布局时可在根组件调用一次以启用实时同步。
 */
export function useUnreadSync(): void {
  const queryClient = useQueryClient();
  const { messageService } = useServices();
  const { activeChannel } = useStrategy();
  const activeChannelRef = useRef(activeChannel);

  /**
   * 后端在“离线推送”场景会标记消息为 imPushStatus='offline'。
   * 这类消息即使是 incoming，也不应计入前端未读增量（-增量 delta +1）。
   */
  const isOfflineIncomingMessage = useCallback(
    (message: StandardMessage): boolean => {
      const imPushStatus = message.metadata?.imPushStatus as string | undefined;

      return imPushStatus === 'offline';
    },
    [],
  );

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  const messageSyncService = useMemo(
    () => new MessageSyncService(queryClient),
    [queryClient],
  );

  useEffect(() => {
    if (
      !messageService?.subscribeToMessages &&
      !messageService?.subscribeToMessageStatus
    ) {
      return;
    }

    const unsubscribeMessages = messageService?.subscribeToMessages?.(
      (event) => {
        const syncResult = messageSyncService.pushNewMessage(event);

        if (!syncResult.isNewMessage || !event.conversationId) {
          return;
        }

        const channel = event.message.channelType;
        const conversationId = event.conversationId;

        // 更新会话摘要（lastMessage + lastMessageTime）并置顶
        ConversationCacheHelper.updateConversationSummary(
          queryClient,
          conversationId,
          channel,
          event.message,
        );

        if (event.message.direction === MessageDirectionEnum.Incoming) {
          if (isOfflineIncomingMessage(event.message)) {
            // 离线推送只用于补齐消息列表，不计入未读增量
            return;
          }

          // 渠道级未读增量 +1
          queryClient.setQueryData<UnreadCountResult>(
            queryKeys.conversations.unreadDeltas.channel(),
            (old) => {
              const current = old ?? {};
              const prev = current[channel] ?? 0;
              return {
                ...current,
                [channel]: prev + 1,
              };
            },
          );

          // 会话级未读增量 +1
          queryClient.setQueryData<Record<string, number>>(
            queryKeys.conversations.unreadDeltas.conversation(),
            (old) => {
              const current = old ?? {};
              const prev = current[conversationId] ?? 0;
              return {
                ...current,
                [conversationId]: prev + 1,
              };
            },
          );
        }
      },
    );

    const unsubscribeStatus = messageService?.subscribeToMessageStatus?.(
      (event) => {
        // useMessageStatusSync 负责更新消息缓存；
        // 此处只处理未读计数：Read ACK → 会话/渠道增量 -1
        const channel = event.channelType ?? activeChannelRef.current;
        const conversationId = event.conversationId;
        if (
          event.status === MessageStatusEnum.Read &&
          channel &&
          conversationId
        ) {
          const conversationDetail =
            ConversationCacheHelper.getConversationDetail(
              queryClient,
              conversationId,
            );

          const baseConversationUnread =
            conversationDetail?.unreadCount ??
            ConversationCacheHelper.getConversations(queryClient, channel).find(
              (c) => c.id === conversationId,
            )?.unreadCount ??
            0;

          const deltaByConversation =
            queryClient.getQueryData<Record<string, number>>(
              queryKeys.conversations.unreadDeltas.conversation(),
            ) ?? {};

          const prevConversationDelta =
            deltaByConversation[conversationId] ?? 0;

          const clampedPrevConversationDelta = clampDeltaByBase(
            baseConversationUnread,
            prevConversationDelta,
          );

          const effectiveUnreadBeforeConversation = Math.max(
            0,
            baseConversationUnread + clampedPrevConversationDelta,
          );

          // 渠道基线来自服务端的 getUnreadCount()，用于补偿离线推送场景：
          // 可能存在 conversation cache unreadCount 落后/缺失，但渠道 badge 的
          // 基线未读已正确为正的情况。
          const baseUnreadByChannel =
            queryClient.getQueryData<UnreadCountResult>(
              queryKeys.conversations.unread(),
            ) ?? {};

          const baseChannelUnread =
            baseUnreadByChannel[channel] ??
            ConversationCacheHelper.getConversations(
              queryClient,
              channel,
            ).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

          const deltaByChannel =
            queryClient.getQueryData<UnreadCountResult>(
              queryKeys.conversations.unreadDeltas.channel(),
            ) ?? {};

          const prevChannelDelta = deltaByChannel[channel] ?? 0;

          const clampedPrevChannelDelta = clampDeltaByBase(
            baseChannelUnread,
            prevChannelDelta,
          );

          const effectiveUnreadBeforeChannel = Math.max(
            0,
            baseChannelUnread + clampedPrevChannelDelta,
          );

          // 会话级与渠道级分别判断是否还能扣减到 0。
          const amountToDecrementConversation =
            effectiveUnreadBeforeConversation >= 1 ? 1 : 0;
          const amountToDecrementChannel =
            effectiveUnreadBeforeChannel >= 1 ? 1 : 0;

          if (amountToDecrementConversation > 0) {
            // 会话级未读增量 -1（带基线保护：base + delta 不能 < 0）
            queryClient.setQueryData<Record<string, number>>(
              queryKeys.conversations.unreadDeltas.conversation(),
              (old) => {
                const current = old ?? {};
                const prev = current[conversationId] ?? 0;

                const clampedPrev = clampDeltaByBase(
                  baseConversationUnread,
                  prev,
                );
                const next = clampDeltaByBase(
                  baseConversationUnread,
                  clampedPrev - amountToDecrementConversation,
                );

                if (next === 0) {
                  const { [conversationId]: _, ...rest } = current;
                  return rest;
                }

                return {
                  ...current,
                  [conversationId]: next,
                };
              },
            );
          }

          if (amountToDecrementChannel > 0) {
            // 渠道级未读增量 -1（同样保证 base + delta 不为负）
            queryClient.setQueryData<UnreadCountResult>(
              queryKeys.conversations.unreadDeltas.channel(),
              (old) => {
                const current = old ?? {};
                const prev = current[channel] ?? 0;

                const clampedPrev = clampDeltaByBase(baseChannelUnread, prev);
                const next = clampDeltaByBase(
                  baseChannelUnread,
                  clampedPrev - amountToDecrementChannel,
                );

                // delta 为 0 时移除 key，避免积累大量无效项
                if (next === 0) {
                  const { [channel]: _, ...rest } = current;
                  return rest;
                }

                return {
                  ...current,
                  [channel]: next,
                };
              },
            );
          }
        }
      },
    );

    return () => {
      unsubscribeMessages?.();
      unsubscribeStatus?.();
    };
  }, [
    messageService,
    messageSyncService,
    queryClient,
    isOfflineIncomingMessage,
  ]);
}
