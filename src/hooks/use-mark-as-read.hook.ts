import { useMutation } from '@tanstack/react-query';
import { useServices } from '@/providers/service.provider';

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
export function useMarkAsRead<TParams = any>() {
  const { messageService } = useServices();

  return useMutation({
    mutationFn: (params: TParams) => messageService.markAsRead(params as any),
  });
}
