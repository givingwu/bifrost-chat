import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type { AckPacketBody } from '@/interfaces/protocol.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

export interface MarkAsReadParams {
  conversationId: string;
  messageIds: string[];
}

interface MarkAsReadContext {
  conversationId: string;
  previousData: unknown;
}

interface MessagesQueryData {
  pages: Array<{
    items: StandardMessage[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
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

/**
 * 从消息对象构建 AckPacketBody
 *
 * @description
 * 用于将批量标记已读参数转换为协议层需要的 ACK 参数。
 *
 * @param message - 消息对象
 * @param conversationId - 会话 ID
 * @returns AckPacketBody 或 null（如果消息缺少必要信息）
 */
function buildAckPacketBody(
  message: StandardMessage,
  conversationId: string,
): AckPacketBody | null {
  // Incoming 消息的 sender 是对方
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

/**
 * 使用标记已读的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理消息已读标记。
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function MessageList({ conversationId }) {
 *   const markAsRead = useMarkAsRead();
 *
 *   useEffect(() => {
 *     // 当用户查看消息时，标记为已读
 *     markAsRead.mutate({
 *       conversationId,
 *       messageIds: ['msg-1', 'msg-2'],
 *     });
 *   }, [conversationId]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();

  return useMutation<
    void,
    unknown,
    MarkAsReadParams,
    MarkAsReadContext | undefined
  >({
    mutationFn: async (params: MarkAsReadParams) => {
      const { conversationId, messageIds } = params;

      // 从 QueryCache 获取消息列表
      const queryData = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );

      if (!isMessagesQueryData(queryData)) {
        throw new Error('Messages query data not found');
      }

      // 提取所有消息对象
      const allMessages = queryData.pages.flatMap(
        (page) => page.items,
      ) as StandardMessage[];
      const messagesToMark = allMessages.filter((msg) => {
        const messageId = msg.id || msg.tempId;
        return messageId && messageIds.includes(messageId);
      });

      // 循环调用 markAsRead
      const errors: Array<{ messageId: string; error: unknown }> = [];

      for (const message of messagesToMark) {
        try {
          const ackPacketBody = buildAckPacketBody(message, conversationId);

          if (ackPacketBody) {
            await messageService.markAsRead(ackPacketBody);
          }
        } catch (error) {
          errors.push({ messageId: message.id, error });
        }
      }

      // 如果全部失败，抛出错误
      if (errors.length === messagesToMark.length && errors.length > 0) {
        throw new Error(
          `Failed to mark all messages as read: ${errors[0].error}`,
        );
      }

      // 部分失败时记录警告
      if (errors.length > 0) {
        console.warn('[markAsRead] Partial failure:', errors);
      }
    },
    onMutate: async (params) => {
      const { conversationId, messageIds } = params;
      if (messageIds.length === 0) {
        return undefined;
      }

      void queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      const previousData = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );
      const readMessageIds = new Set(messageIds);

      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (oldData: unknown) => {
          if (!isMessagesQueryData(oldData)) {
            return oldData;
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                const messageId = item.id || item.tempId;
                const shouldMarkAsRead =
                  !!messageId &&
                  readMessageIds.has(messageId) &&
                  item.status !== MessageStatusEnum.Read;

                return shouldMarkAsRead
                  ? { ...item, status: MessageStatusEnum.Read }
                  : item;
              }),
            })),
          };
        },
      );

      return {
        conversationId,
        previousData,
      };
    },
    onError: (error, params, context) => {
      if (error) {
        console.error('[use-mark-as-read] error: ', error);
        console.log('[use-mark-as-read] params: ', params);
      }
      if (!context) return;

      queryClient.setQueryData(
        queryKeys.messages.list(context.conversationId),
        context.previousData,
      );
    },
  });
}
