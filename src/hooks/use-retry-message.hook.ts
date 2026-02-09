import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * 重试失败消息的 Hook
 *
 * @description
 * 用于重试发送失败的消息
 * 从离线队列获取消息，重新发送，成功后从队列移除
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function MessageBubble({ message, conversationId }) {
 *   const retryMessage = useRetryMessage();
 *
 *   if (message.status === MessageStatusEnum.Failed && message._offlineMessageId) {
 *     return (
 *       <button
 *         onClick={() => retryMessage.mutate({
 *           conversationId,
 *           offlineMessageId: message._offlineMessageId,
 *         })}
 *         disabled={retryMessage.isPending}
 *       >
 *         重试
 *       </button>
 *     );
 *   }
 * }
 * ```
 */
export function useRetryMessage() {
  const queryClient = useQueryClient();
  const { messageService, offlineMessageQueue } = useServices();

  return useMutation<
    void,
    Error,
    {
      conversationId: string;
      offlineMessageId: string;
    }
  >({
    // 手动重试场景下，禁用 React Query 自动重试，避免按钮长时间锁定
    retry: false,
    mutationFn: async ({ conversationId, offlineMessageId }) => {
      // 1. 从离线队列获取消息
      if (!offlineMessageQueue) {
        throw new Error('THe offline message queue cannot works');
      }

      const allMessages = await offlineMessageQueue.getAll();
      const offlineMsg = allMessages.find((msg) => msg.id === offlineMessageId);

      if (!offlineMsg) {
        throw new Error('Cannot find any offline message');
      }

      // 2. 重新发送
      if (!messageService) {
        throw new Error('messageService is not available');
      }

      await messageService.send(conversationId, offlineMsg.sendParams);

      // 3. 发送成功，从队列中移除
      await offlineMessageQueue.dequeue(offlineMessageId);
    },

    onMutate: async ({ conversationId, offlineMessageId }) => {
      // 取消查询
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      // 更新消息状态为 Sending
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: StandardMessage) =>
                item._offlineMessageId === offlineMessageId
                  ? { ...item, status: MessageStatusEnum.Sending }
                  : item,
              ),
            })),
          };
        },
      );
    },

    onSuccess: (_, { conversationId }) => {
      // 刷新消息列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });
    },

    onError: (error, { conversationId, offlineMessageId }) => {
      console.error('[useRetryMessage] Retry failed:', error);

      // 更新消息状态为 Failed
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: StandardMessage) =>
                item._offlineMessageId === offlineMessageId
                  ? {
                      ...item,
                      status: MessageStatusEnum.Failed,
                      error: error.message,
                    }
                  : item,
              ),
            })),
          };
        },
      );
    },
  });
}
