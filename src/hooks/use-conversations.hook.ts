import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/conversation-cache-helper.service';

/**
 * 使用会话列表的 Hook
 *
 * @description
 * 使用 React Query 管理会话列表的获取和缓存。
 * 数据会在 5 分钟内视为新鲜，不会重复请求。
 * 若宿主实现了会话实时订阅接口，Hook 会将回灌结果同步进 Query 缓存。
 *
 * @param params 查询参数（可选，类型由服务实现决定）
 * @param options 选项
 * @returns Query 结果
 *
 * @example
 * ```tsx
 * function ConversationList() {
 *   const { data: conversations, isLoading, error } = useConversations();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <ul>
 *       {conversations?.map(conversation => (
 *         <ConversationItem key={conversation.id} {...conversation} />
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useConversations<TListParams = Record<string, unknown>>(
  options?: { enabled?: boolean },
  params?: TListParams,
) {
  const queryClient = useQueryClient();
  const { conversationService } = useServices();

  const query = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: () => {
      if (!conversationService) {
        return Promise.resolve([]);
      }
      return conversationService.list(params);
    },
    enabled: (options?.enabled ?? true) && !!conversationService,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });

  useEffect(() => {
    if (!conversationService?.subscribeToListUpdates) {
      return;
    }

    // 优先接入会话列表级别的权威回灌。
    return conversationService.subscribeToListUpdates((conversations) => {
      ConversationCacheHelper.replaceConversationList(
        queryClient,
        conversations,
      );
    });
  }, [conversationService, queryClient]);

  useEffect(() => {
    if (
      !conversationService?.subscribeToConversationUpdates ||
      !query.data?.length
    ) {
      return;
    }

    // 对已知会话补充单会话级回灌，覆盖本地 optimistic unread。
    const unsubscribeList = query.data.map((conversation) =>
      conversationService.subscribeToConversationUpdates?.(
        conversation.id,
        (nextConversation) => {
          ConversationCacheHelper.replaceConversation(
            queryClient,
            nextConversation,
          );
        },
      ),
    );

    return () => {
      for (const unsubscribe of unsubscribeList) {
        unsubscribe?.();
      }
    };
  }, [conversationService, query.data, queryClient]);

  return query;
}
