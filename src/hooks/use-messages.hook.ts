import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageMerger } from '@/services/message-merger.service';

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
 * 支持从下往上的无限滚动加载（聊天应用模式）。
 *
 * **后端分页格式**：
 * - 第一页：返回最新的30条消息（降序：[30, 29, ..., 1]，索引0是最新的）
 * - 第二页：返回更早的30条消息（降序：[60, 59, ..., 31]，索引0是第31新的）
 * - 以此类推...
 *
 * **前端显示顺序**：
 * - 前端需要反转页面顺序：`[...pages].reverse().flatMap(page => page.items)`
 * - 最终显示：[60, 59, ..., 31, 30, 29, ..., 1]（更旧的在上，更新的在下）
 *
 * **滚动行为**：
 * - 初始加载：自动滚动到底部（最新消息）
 * - 向上滚动：滚动到顶部时加载更早的消息
 * - 新消息：仅在用户靠近底部时自动滚动
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
 *   // ✅ 正确：反转页面顺序
 *   const messages = data?.pages.slice().reverse().flatMap(page => page.items) || [];
 *
 *   // 向上滚动到顶部时加载历史消息
 *   const handleScroll = (e) => {
 *     if (e.target.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
 *       fetchNextPage();
 *     }
 *   };
 *
 *   return (
 *     <div onScroll={handleScroll}>
 *       {isFetchingNextPage && <Spinner />} // 顶部加载指示器
 *       {messages.map(msg => (
 *         <MessageBubble key={msg.id} {...msg} />
 *       ))}
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

  // 获取离线队列中的失败消息
  const { data: offlineMessages = [] } = useQuery({
    queryKey: ['offlineMessages', conversationId],
    queryFn: async () => {
      if (!services?.offlineMessageQueue) {
        return [];
      }
      try {
        return await services.offlineMessageQueue.getByConversation(
          conversationId,
        );
      } catch (error) {
        console.error('[useMessages] 获取离线消息失败:', error);
        return [];
      }
    },
    staleTime: 0, // 始终重新获取
    enabled: !!conversationId && !!services?.offlineMessageQueue,
  });

  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId),
    queryFn: async ({ pageParam = 1 }) => {
      if (!services?.messageService) {
        return {
          items: [],
          nextCursor: undefined,
        } as MessagesPage;
      }

      const serverMessages = await services.messageService.list(
        conversationId,
        {
          ...(params ?? {}),
          page: pageParam,
        } as TParams,
      );

      // 合并服务端消息和失败消息
      const mergedMessages = MessageMerger.merge(
        serverMessages,
        offlineMessages,
      );

      return {
        items: mergedMessages,
        nextCursor: mergedMessages.length >= 20 ? pageParam + 1 : undefined,
      } as MessagesPage;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 分钟
    enabled: !!conversationId && !!services?.messageService, // 只有当 conversationId 和服务都存在时才执行查询
  });
}
