import { useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/use-messages.hook';
import { ChatMessageList } from './ChatMessageList';

export interface ChatMessageListContainerProps {
  /** 会话 ID */
  conversationId: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * ChatMessageListContainer：消息列表容器组件
 *
 * @description
 * 使用 React Query Hook 获取消息列表数据，支持无限滚动加载。
 *
 * @example
 * ```tsx
 * function ChatPanel({ conversationId }) {
 *   return (
 *     <ServiceProvider {...services}>
 *       <ChatMessageListContainer conversationId={conversationId} />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function ChatMessageListContainer({
  conversationId,
  className,
}: ChatMessageListContainerProps) {
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
  const messages = data?.pages.flatMap((page) => page.items) || [];

  // 无限滚动处理
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

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
      ref={scrollRef}
      className={`flex h-full flex-col ${className || ''}`}
      style={{ overflowY: 'auto' }}
    >
      {/* 加载更多指示器 */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <ChatMessageList messages={messages} />

      {/* 初始加载指示器 */}
      {isLoading && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
