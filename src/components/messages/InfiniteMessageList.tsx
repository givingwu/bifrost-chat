import { useEffect, useMemo, useRef } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { useMessages } from '@/hooks/use-messages.hook';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';
import { logger } from '@/utils/logger.util';
import { MessageList } from './MessageList';

export interface InfiniteMessageListProps {
  /** 会话 ID */
  conversationId: string;
  /** 当前渠道（用于渠道切换时刷新） */
  currentChannel?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用自动标记已读，默认 true */
  enableAutoMarkAsRead?: boolean;
  /** 标记已读的防抖延迟（毫秒），默认 1000ms */
  markAsReadDebounceDelay?: number;
}

const TOP_LOAD_THRESHOLD = 80;
const BOTTOM_STICKY_THRESHOLD = 120;

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
 * - 反向渲染：通过 column-reverse 实现底部锚定
 * - 自动滚动：新消息到达时智能滚动到底部（仅当用户在底部附近时）
 * - 性能优化：使用 React Query 缓存和虚拟滚动
 *
 * @scrolling
 * - **初始加载**：自动滚动到底部（最新消息）
 * - **向上滚动**：滚动到顶部时加载更早的消息
 * - **位置保持**：依赖 column-reverse 的天然锚点保持
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
  currentChannel,
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
    refetch,
  } = useMessages({
    conversationId,
    currentChannel,
  });

  const scrollRef = useRef<HTMLDivElement | null>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const hasInitialScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // 会话/渠道切换时无需在此 invalidate：useMessages 的 queryKey 已包含
  // conversationId 与 currentChannel，切换后会自动作为新 query 拉取数据。

  // ✅ Bug 1 修复：反转页面顺序，确保更早的消息显示在上面
  // 后端返回格式：第一页 [30,29,...,1]（降序），第二页 [60,59,...,31]（降序）
  // 期望显示顺序：[60,...,31,30,...,1]（更旧的在上，更新的在下）
  const messages = useMemo(() => {
    const pages = data?.pages || [];
    logger.info('[InfiniteMessageList] 当前页面数:', pages.length);
    logger.info(
      '[InfiniteMessageList] 各页面消息数:',
      pages.map((p) => p.items.length),
    );

    // 打印第一页（最新消息）的前3条和后3条
    if (pages.length > 0) {
      const firstPage = pages[0];
      logger.info(
        '[InfiniteMessageList] 第一页（page 0）的前3条消息:',
        firstPage.items.slice(0, 3).map((m) => ({
          id: m.id,
          tempId: m.tempId,
          timestamp: m.timestamp,
          status: m.status,
        })),
      );
      logger.info(
        '[InfiniteMessageList] 第一页（page 0）的后3条消息:',
        firstPage.items.slice(-3).map((m) => ({
          id: m.id,
          tempId: m.tempId,
          timestamp: m.timestamp,
          status: m.status,
        })),
      );
    }

    const reversedMessages = MessageCacheHelper.dedupeMessages(
      [...pages].reverse().flatMap((page) => page.items) || [],
    );
    logger.info(
      '[InfiniteMessageList] 反转后的总消息数:',
      reversedMessages.length,
    );
    logger.info(
      '[InfiniteMessageList] 反转后的前3条消息:',
      reversedMessages.slice(0, 3).map((m) => ({
        id: m.id,
        tempId: m.tempId,
        timestamp: m.timestamp,
        status: m.status,
      })),
    );
    logger.info(
      '[InfiniteMessageList] 反转后的后3条消息:',
      reversedMessages.slice(-3).map((m) => ({
        id: m.id,
        tempId: m.tempId,
        timestamp: m.timestamp,
        status: m.status,
      })),
    );

    return reversedMessages;
  }, [data]);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
    isNearBottomRef.current = !!conversationId;
    lastMessageCountRef.current = 0;
  }, [conversationId]);

  // 无限滚动处理（兼容虚拟滚动和传统滚动）
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const normalizedScrollTop = Math.max(0, Math.abs(element.scrollTop));
      isNearBottomRef.current = normalizedScrollTop <= BOTTOM_STICKY_THRESHOLD;

      const distanceToTop =
        element.scrollHeight - element.clientHeight - normalizedScrollTop;

      if (
        distanceToTop <= TOP_LOAD_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 初始加载完成后滚动到底部（column-reverse 下为 scrollTop=0）
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (
      !isLoading &&
      !isFetchingNextPage &&
      messages.length > 0 &&
      !hasInitialScrolledRef.current
    ) {
      element.scrollTop = 0;
      hasInitialScrolledRef.current = true;
      lastMessageCountRef.current = messages.length;
    }
  }, [isLoading, isFetchingNextPage, messages.length]);

  // 新消息到达时：仅当用户在底部附近，自动贴底
  useEffect(() => {
    if (!hasInitialScrolledRef.current || isFetchingNextPage) return;

    const previousCount = lastMessageCountRef.current;
    if (messages.length <= previousCount) {
      lastMessageCountRef.current = messages.length;
      return;
    }

    if (isNearBottomRef.current) {
      const element = scrollRef.current;
      if (element) {
        element.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }

    lastMessageCountRef.current = messages.length;
  }, [isFetchingNextPage, messages.length]);

  // 错误状态
  if (error) {
    logger.error('Failed to load messages:', error);

    return (
      <ErrorState
        className="flex h-full flex-col items-center justify-center"
        message="Loading failed, please try again"
        retryText="Retry"
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div
      data-component="infinite-message-list"
      className={`flex h-full flex-col overflow-y-auto ${className || ''}`}
    >
      {isFetchingNextPage && (
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
        enableVirtualization={false}
        reverse={true}
      />

      {isLoading && !data && (
        <div className="flex justify-center py-2">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
