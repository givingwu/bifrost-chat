import { useEffect, useMemo, useRef } from 'react';
import { useMessages } from '@/hooks/use-messages.hook';
import { useNearBottom } from '@/hooks/use-near-bottom.hook';
import { MessageList } from './MessageList';

export interface InfiniteMessageListProps {
  /** 会话 ID */
  conversationId: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * InfiniteMessageList：无限滚动消息列表组件
 *
 * @description
 * 使用 React Query Hook 获取消息列表数据，支持无限滚动加载。
 * 集成虚拟滚动功能，大幅提升大量消息场景下的性能。
 * 当用户滚动到顶部时自动加载更多历史消息。
 *
 * @features
 * - 虚拟滚动：只渲染可见区域的消息，支持 1000+ 条消息不卡顿
 * - 无限加载：自动加载历史消息
 * - 智能滚动：加载历史消息时保持当前滚动位置
 * - 自动滚动：新消息到达时自动滚动到底部（仅当用户在底部附近时）
 * - 性能优化：使用 React Query 缓存和虚拟滚动
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
}: InfiniteMessageListProps) {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 扁平化所有页面的消息
  const messages = useMemo(
    () => data?.pages.flatMap((page) => page.items) || [],
    [data],
  );

  // 检测用户是否在底部附近（用于智能自动滚动）
  const isNearBottom = useNearBottom(scrollRef, { threshold: 100 });

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

  // 新消息到达时自动滚动到底部（仅当用户在底部附近时）
  useEffect(() => {
    if (!isNearBottom || messages.length === 0) return;

    const element = scrollRef.current;

    if (!element) return;

    // 滚动到底部
    element.scrollTop = element.scrollHeight;
  }, [messages.length, isNearBottom]);

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
      className={`flex h-full flex-col ${className || ''}`}
      style={{ overflowY: 'auto' }}
    >
      {/* 加载更多指示器 */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <MessageList messages={messages} scrollRef={scrollRef} />

      {/* 初始加载指示器 */}
      {isLoading && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
