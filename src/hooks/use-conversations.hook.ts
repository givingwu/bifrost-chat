import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * 使用会话列表的 Hook
 *
 * @description
 * 使用 React Query 管理会话列表的获取和缓存。
 * 数据会在 5 分钟内视为新鲜，不会重复请求。
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
export function useConversations<TParams = any>(
  params?: TParams,
  options?: { enabled?: boolean },
) {
  const services = useServices();

  return useQuery({
    queryKey: queryKeys.conversations.list(
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => {
      if (!services?.conversationService) {
        return Promise.resolve([]);
      }
      return services.conversationService.list(params);
    },
    enabled: (options?.enabled ?? true) && !!services?.conversationService,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });
}
