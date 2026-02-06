import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 支持乐观更新，创建成功后会自动更新会话列表缓存。
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function CreateConversationButton() {
 *   const createConversation = useCreateConversation();
 *
 *   const handleCreate = async () => {
 *     try {
 *       const newConversation = await createConversation.mutateAsync({
 *         userId: 'user-123',
 *         channel: 'whatsapp',
 *       });
 *       console.log('会话创建成功:', newConversation);
 *     } catch (error) {
 *       console.error('创建失败:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCreate} disabled={createConversation.isPending}>
 *       创建会话
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateConversation<TParams = Conversation>() {
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  return useMutation({
    mutationFn: (params: TParams) => conversationService.create(params),

    // 乐观更新：在请求发送前立即更新 UI
    onMutate: async (params) => {
      // 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.lists(),
      });

      // 保存旧数据，以便在出错时回滚
      const previousConversations = queryClient.getQueryData(
        queryKeys.conversations.lists(),
      );

      return { previousConversations };
    },

    // 如果出错，回滚到之前的状态
    onError: (error, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations,
        );
      }
    },

    // 成功后，重新获取会话列表以确保数据一致性
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.lists(),
      });
    },
  });
}
