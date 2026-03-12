import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 创建成功后会直接更新会话列表缓存，确保新会话立即显示。
 *
 * **设计说明**：
 * - 不使用乐观更新（onMutate），因为创建操作不需要预先修改缓存
 * - 使用 `invalidateQueries` 模糊匹配刷新所有相关查询，解耦 queryKey 结构
 * - `ConversationCacheHelper.upsertConversation` 负责精确更新特定渠道的缓存
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
export function useCreateConversation<
  TParams extends Conversation = Conversation,
>(enableUpsert: boolean) {
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  return useMutation({
    mutationFn: (params: TParams) => conversationService.create(params),

    onSuccess: (newConversation) => {
      // 从返回的会话中获取 channel，确保更新到正确的渠道列表
      const channel = newConversation.channel;

      // 直接将新会话插入缓存（精确更新特定渠道）
      if (enableUpsert) {
        ConversationCacheHelper.upsertConversation(
          queryClient,
          newConversation,
          channel,
        );
      }

      // 使用模糊匹配 invalidate 所有 conversations list 查询
      // lists() 返回 ['conversations', 'list']，会匹配所有以它开头的 key
      // 这样即使宿主层自定义了 queryKey 结构，也能正确刷新
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.lists(),
      });
    },

    onError: (error, params) => {
      // 创建失败只记录日志，不需要回滚缓存
      // 因为创建操作不会预先修改缓存
      if (error) {
        console.error('[use-create-conversation] error: ', error);
        console.log('[use-create-conversation] params: ', params);
      }
    },
  });
}
