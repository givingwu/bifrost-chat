import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * 删除失败消息的 Hook
 *
 * @description
 * 用于删除本地失败的消息（不发送到服务端）
 * 从离线队列中删除消息，并刷新消息列表
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function MessageBubble({ message, conversationId }) {
 *   const deleteMessage = useDeleteFailedMessage();
 *
 *   if (message.status === MessageStatusEnum.Failed && message._offlineMessageId) {
 *     return (
 *       <button
 *         onClick={() => deleteMessage.mutate({
 *           conversationId,
 *           offlineMessageId: message._offlineMessageId,
 *         })}
 *         disabled={deleteMessage.isPending}
 *       >
 *         删除
 *       </button>
 *     );
 *   }
 * }
 * ```
 */
export function useDeleteFailedMessage() {
  const queryClient = useQueryClient();
  const { offlineMessageQueue } = useServices();

  return useMutation<
    void,
    Error,
    {
      conversationId: string;
      offlineMessageId: string;
    }
  >({
    mutationFn: async ({ conversationId, offlineMessageId }) => {
      // 从离线队列中删除
      if (!offlineMessageQueue) {
        throw new Error('offlineMessageQueue is not available');
      }

      await offlineMessageQueue.dequeue(offlineMessageId);
    },

    onSuccess: (_, { conversationId }) => {
      // 刷新消息列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });
    },

    onError: (error) => {
      console.error('[useDeleteFailedMessage] Delete failed:', error);
    },
  });
}
