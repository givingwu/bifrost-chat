import { useInfiniteQuery } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * 消息分页数据
 */
export interface MessagesPage {
  items: StandardMessage[];
  nextCursor?: number;
}

/**
 * 使用消息列表的 Hook（支持无限滚动）
 *
 * @description
 * 使用 React Query Infinite Query 管理消息列表的获取和缓存。
 * 支持无限滚动加载更多消息。
 *
 * @param conversationId 会话 ID
 * @param params 查询参数（可选，类型由服务实现决定）
 * @returns Infinite Query 结果
 *
 * @example
 * ```tsx
 * function MessageList({ conversationId }) {
 *   const {
 *     data,
 *     isLoading,
 *     error,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useMessages(conversationId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   const messages = data?.pages.flatMap(page => page.items) || [];
 *
 *   return (
 *     <div onScroll={(e) => {
 *       const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
 *       if (bottom && hasNextPage && !isFetchingNextPage) {
 *         fetchNextPage();
 *       }
 *     }}>
 *       {messages.map(message => (
 *         <MessageBubble key={message.id} {...message} />
 *       ))}
 *       {isFetchingNextPage && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMessages<TParams = any>(
  conversationId: string,
  params?: TParams,
) {
  const services = useServices();

  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId),
    queryFn: async ({ pageParam = 1 }) => {
      if (!services?.messageService) {
        return {
          items: [],
          nextCursor: undefined,
        } as MessagesPage;
      }
      const messages = await services.messageService.list(
        conversationId,
        { ...(params ?? {}), page: pageParam } as TParams,
      );

      return {
        items: messages,
        nextCursor: messages.length >= 20 ? pageParam + 1 : undefined,
      } as MessagesPage;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 分钟
    enabled: !!conversationId && !!services?.messageService, // 只有当 conversationId 和服务都存在时才执行查询
  });
}
