import { useEffect, useMemo, useRef } from 'react';
import { useMessages } from '@/hooks/use-messages.hook';
import { MessageList } from './MessageList';

export interface InfiniteMessageListProps {
  /** 会话 ID */
  conversationId: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用自动标记已读，默认 true */
  enableAutoMarkAsRead?: boolean;
  /** 标记已读的防抖延迟（毫秒），默认 1000ms */
  markAsReadDebounceDelay?: number;
}

/**
 * InfiniteMessageList：无限滚动消息列表组件
 *
 * @description
 * 使用 React Query Hook 获取消息列表数据，支持从下往上的无限滚动加载。
 * 集成虚拟滚动功能，大幅提升大量消息场景下的性能。
 * 当用户滚动到顶部时自动加载更多历史消息。
 *
 * @features
 * - 虚拟滚动：只渲染可见区域的消息，支持 1000+ 条消息不卡顿
 * - 无限加载：向上滚动时自动加载历史消息
 * - 智能滚动：加载历史消息时保持当前滚动位置
 * - 自动滚动：新消息到达时智能滚动到底部（仅当用户在底部附近时）
 * - 性能优化：使用 React Query 缓存和虚拟滚动
 *
 * @scrolling
 * - **初始加载**：自动滚动到底部（最新消息）
 * - **向上滚动**：滚动到顶部时加载更早的消息
 * - **位置保持**：加载历史消息时保持当前视图位置
 * - **智能滚动**：新消息仅在用户靠近底部时自动滚动
 *
 * @example
 * ```tsx
 * function ChatPanel({ conversationId }) {
 *   return (
 *     <ServiceProvider {...services}>
 *       <InfiniteMessageList conversationId={conversationId} />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function InfiniteMessageList({
  conversationId,
  className,
  enableAutoMarkAsRead = true,
  markAsReadDebounceDelay = 1000,
}: InfiniteMessageListProps) {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const scrollRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.RefObject<HTMLDivElement>;

  // 保存加载前的滚动高度，用于加载后恢复位置
  const previousScrollHeightRef = useRef<number>(0);

  // ✅ Bug 1 修复：反转页面顺序，确保更早的消息显示在上面
  // 后端返回格式：第一页 [30,29,...,1]（降序），第二页 [60,59,...,31]（降序）
  // 期望显示顺序：[60,...,31,30,...,1]（更旧的在上，更新的在下）
  const messages = useMemo(
    () =>
      [...(data?.pages || [])].reverse().flatMap((page) => page.items) || [],
    [data],
  );

  // ✅ Bug 4 新增：检测用户是否在底部附近（用于智能滚动）
  const isNearBottom = useMemo(() => {
    const element = scrollRef.current;
    if (!element || isLoading) return false;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100;
  }, [isLoading]);

  // 无限滚动处理（兼容虚拟滚动和传统滚动）
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;

      const { scrollTop } = element;
      // 当滚动到顶部 100px 时加载更多
      if (scrollTop < 100) {
        fetchNextPage();
      }
    };

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ✅ Bug 2 修复：初始加载完成后滚动到底部
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // 只在初始加载完成时滚动到底部
    if (
      !isLoading &&
      !isFetchingNextPage &&
      messages.length > 0 &&
      data?.pages.length === 1
    ) {
      element.scrollTop = element.scrollHeight;
    }
  }, [isLoading, isFetchingNextPage, messages.length, data?.pages.length]);

  // ✅ Bug 3 新增：加载历史消息前保存滚动位置
  useEffect(() => {
    if (isFetchingNextPage && !previousScrollHeightRef.current) {
      const element = scrollRef.current;
      if (element) {
        previousScrollHeightRef.current = element.scrollHeight;
      }
    }
  }, [isFetchingNextPage]);

  // ✅ Bug 3 新增：加载完成后恢复滚动位置
  useEffect(() => {
    if (
      !isFetchingNextPage &&
      previousScrollHeightRef.current > 0 &&
      data?.pages &&
      data.pages.length > 1
    ) {
      const element = scrollRef.current;
      if (element) {
        const newScrollHeight = element.scrollHeight;
        const heightDifference =
          newScrollHeight - previousScrollHeightRef.current;
        element.scrollTop = element.scrollTop + heightDifference;
        previousScrollHeightRef.current = 0;
      }
    }
  }, [isFetchingNextPage, data]);

  // ✅ Bug 4 新增：新消息到达时智能滚动到底部
  useEffect(() => {
    // 只在第一页数据变化时（新消息到达）且用户在底部附近时触发
    if (data?.pages.length === 1 && isNearBottom && messages.length > 0) {
      const element = scrollRef.current;
      if (element) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages.length, isNearBottom, data?.pages.length]);

  // 错误状态
  if (error) {
    console.error('Failed to load messages:', error);

    return (
      <div className="flex h-full items-center justify-center text-red-500">
        加载失败，请重试
      </div>
    );
  }

  return (
    <div
      data-component="infinite-message-list"
      className={`flex h-full flex-col overflow-y-auto ${className || ''}`}
      style={{ overflowY: 'auto' }}
    >
      {/* ✅ 优化：历史消息加载指示器（仅在加载第二页及以后时显示） */}
      {isFetchingNextPage && data?.pages && data.pages.length > 1 && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <MessageList
        messages={messages}
        scrollRef={scrollRef}
        enableAutoMarkAsRead={enableAutoMarkAsRead}
        markAsReadDebounceDelay={markAsReadDebounceDelay}
        conversationId={conversationId}
      />

      {/* ✅ 优化：初始加载指示器（仅在首次加载时显示） */}
      {isLoading && !data && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
