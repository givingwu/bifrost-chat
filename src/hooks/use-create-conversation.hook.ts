import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
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

    // 成功后直接更新缓存，确保新会话立即显示
    onSuccess: (newConversation) => {
      // 从返回的会话中获取 channel，确保更新到正确的渠道列表
      const channel = newConversation.channel as ChannelTypeEnum;

      // 直接将新会话插入缓存
      ConversationCacheHelper.upsertConversation(
        queryClient,
        newConversation,
        channel,
      );

      // 同时 invalidate 以确保后续数据一致性
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.lists(),
      });
    },

    // 如果出错，记录日志
    onError: (error, params) => {
      console.error('[useCreateConversation] error: ', error);
      console.log('[useCreateConversation] params: ', params);
    },
  });
}
