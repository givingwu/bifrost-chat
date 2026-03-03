import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { useChatStore } from '@/store';

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 支持乐观更新，创建成功后会调用 list 方法获取最新列表。
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
  const chatStore = useChatStore();
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  return useMutation({
    mutationFn: (params: TParams) => conversationService.create(params),

    // 乐观更新：在请求发送前立即更新 UI
    onMutate: async (params) => {
      console.log('[use-create-conversation] params: ', params);
      // 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.lists(),
      });

      // 保存旧数据，以便在出错时回滚
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.lists(),
      );

      return { previousConversations };
    },

    // 如果出错，回滚到之前的状态
    onError: (error, params, context) => {
      if (error) {
        console.error('[use-create-conversation] error: ', error);
        console.log('[use-create-conversation] params: ', params);
      }

      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations,
        );
      }
    },

    // 成功后，用新创建的会话作为参数调用 list 方法获取最新列表
    onSuccess: async (data) => {
      console.log('[use-create-conversation] data: ', data);

      try {
        // 用服务器返回的新会话作为参数调用 list 方法
        const updatedList = await conversationService.list();
        const isExists = updatedList.some(
          (conversation) => conversation.id === data.id,
        );

        // 如果列表中已存在当前会话，则直接更新
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          isExists
            ? updatedList
            : (old: Conversation[] | undefined) => {
                if (!old) return [data];
                return [data, ...old];
              },
        );

        chatStore.actions.setActiveConversationId(data.id);
      } catch (error) {
        console.error(
          '[use-create-conversation] Failed to refresh list:',
          error,
        );
        // 如果 list 调用失败，回退到 invalidateQueries
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.lists(),
        });
      }
    },
  });
}
