import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';

/**
 * 使用创建会话的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理会话创建。
 * 创建成功后会写入 pending conversation 缓存，确保新会话立即显示。
 *
 * **设计说明**：
 * - 不使用 optimistic mutation，服务端 create 成功后再落 pending cache
 * - pending conversation 作为客户端待确认状态的单一事实来源
 * - 真实 server list / websocket 确认后会自动移除 pending
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
export function useCreateConversation<TParams = Conversation>(
  enableUpsert?: boolean,
) {
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  return useMutation({
    mutationFn: (params: TParams) => conversationService.create(params),

    onSuccess: (newConversation) => {
      // 从返回的会话中获取 channel，确保更新到正确的渠道列表
      const channel = newConversation.channel;

      // 创建成功后写入 pending cache，等待真实 list / 消息确认
      if (enableUpsert) {
        ConversationCacheHelper.upsertPendingConversation(
          queryClient,
          newConversation,
          channel,
        );
      }
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
