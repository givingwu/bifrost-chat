import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationMetadata } from '@/services/core/conversation.service';

/**
 * 使用会话元数据的 Hook
 *
 * @description
 * 使用 React Query 管理会话元数据的获取和缓存。
 * 获取会话的支持渠道、自由文本模板等信息。
 *
 * @param conversationId 会话 ID
 * @returns Query 结果
 *
 * @example
 * ```tsx
 * function ConversationInfo({ conversationId }) {
 *   const { data: metadata, isLoading, error } = useConversationMetadata(conversationId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       <p>支持渠道: {metadata?.supportedChannels?.join(', ')}</p>
 *       <p>客户: {metadata?.customerName}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConversationMetadata<TConversationMetadata extends ConversationMetadata = ConversationMetadata>(conversationId: string) {
  const { conversationService } = useServices();

  return useQuery<TConversationMetadata | null>({
    queryKey: queryKeys.conversations.metadata(conversationId),
    queryFn: async () => {
      // 检查服务是否实现了 getMetadata 方法
      if (!conversationService?.getMetadata) {
        console.warn(
          '[useConversationMetadata] getMetadata method not implemented on conversationService',
        );
        return null;
      }

      return conversationService.getMetadata({ id: conversationId }) as Promise<TConversationMetadata>;
    },
    enabled: !!conversationService?.getMetadata && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });
}
