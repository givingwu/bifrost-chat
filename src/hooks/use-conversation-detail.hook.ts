import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';

/**
 * 获取单个会话详情。
 *
 * @description
 * 使用 `conversationService.get` 获取完整会话 info，并将结果回写到：
 * - `conversations.detail(conversationId)` 详情缓存
 * - 对应渠道的会话列表缓存
 *
 * 若详情缓存已存在，则优先复用，避免重复请求。
 *
 * @param conversationId 会话 ID
 * @returns React Query 查询结果
 */
export function useConversationDetail(conversationId: string) {
  const queryClient = useQueryClient();
  const { conversationService } = useServices();
  const cachedDetail = conversationId
    ? ConversationCacheHelper.getConversationDetail(queryClient, conversationId)
    : undefined;

  return useQuery<Conversation | null>({
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: async () => {
      if (!conversationId) {
        return null;
      }

      const conversation = await conversationService.get(conversationId);

      if (!conversation) {
        return null;
      }

      return ConversationCacheHelper.cacheConversation(
        queryClient,
        conversation,
      );
    },
    enabled: !!conversationId,
    initialData: cachedDetail ?? undefined,
    staleTime: 30 * 1000, // 30 seconds - prevent immediate refetch
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
  });
}
