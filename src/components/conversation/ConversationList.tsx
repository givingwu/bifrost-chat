import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageCircle } from 'lucide-react';
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActiveConversationId } from '@/store';
import { cn } from '@/utils/class.util';
import {
  CONVERSATION_LIST_ITEM_GAP,
  estimateConversationHeight,
  getCachedConversationHeight,
  getConversationHeightCacheKey,
  setCachedConversationHeight,
} from '@/utils/conversation-height.util';
import { ConversationItem } from './ConversationItem';

// ==================== 常量定义 ====================

/** 默认容器类名 */
const DEFAULT_CONTAINER_CLASSNAME =
  'flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 overflow-y-auto';

// ==================== 类型定义 ====================

export interface ConversationListProps {
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 会话列表（可选，如果不提供则自动获取） */
  conversations?: Conversation[] | null;
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 空状态提示 */
  emptyState?: ReactNode;
  /** 加载状态（仅在手动提供 conversations 时有效） */
  isLoading?: boolean;
  /** 是否自动获取数据（默认 true） */
  autoFetch?: boolean;
  /** 错误重试回调 */
  onRetry?: () => void;
  /** 虚拟滚动容器的引用（用于外部访问） */
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** 是否启用虚拟滚动，默认启用 */
  enableVirtualization?: boolean;
  /**
   * 自定义渲染会话列表项的元数据区域
   * 在人名和最后消息之间渲染
   */
  renderItemMeta?: (conversation: Conversation) => React.ReactNode;
  /**
   * 自定义标题 formatter，透传给每个 ConversationItem
   * @see ConversationItemProps.getConversationDisplayTitle
   */
  getConversationDisplayTitle?: (conversation: Conversation) => string;
}

// ==================== 辅助函数 ====================

/**
 * 解析会话的激活状态
 * @param conversation - 会话对象
 * @param activeConversationId - 当前激活的会话 ID
 * @returns 解析后的会话对象
 */
function resolveConversationActive(
  conversation: Conversation,
  activeConversationId: string | null,
): Conversation {
  const resolvedIsActive =
    activeConversationId === null
      ? (conversation.isActive ?? false)
      : conversation.id === activeConversationId;

  // 只有当状态不同时才创建新对象
  if (resolvedIsActive === conversation.isActive) {
    return conversation;
  }

  return { ...conversation, isActive: resolvedIsActive };
}

// ==================== 主组件 ====================

/**
 * ConversationList：会话列表组件。
 *
 * @description
 * - 显示会话列表，支持自动获取数据（使用 useConversations Hook）
 * - 支持手动传入数据（用于测试或特殊场景）
 * - 支持空状态、加载状态和错误状态
 * - 使用 memo 优化性能，避免不必要的重新渲染
 * - 支持无障碍访问（ARIA 标签）
 * - 使用 @tanstack/react-virtual 实现虚拟滚动，提升大量会话场景的性能
 *
 * @features
 * - 虚拟滚动：只渲染可见区域的会话，支持 100+ 条会话不卡顿
 * - 动态高度：自动测量会话项的实际高度
 * - 性能优化：使用稳定 key 缓存已测量的高度
 * - 向后兼容：可通过 `enableVirtualization` 禁用虚拟滚动
 *
 * @example
 * // 自动获取数据（推荐）
 * <ConversationList onSelect={(id) => console.log(id)} />
 *
 * // 手动传入数据（用于测试）
 * <ConversationList conversations={mockData} onSelect={(id) => console.log(id)} />
 *
 * @example 禁用虚拟滚动
 * <ConversationList conversations={mockData} enableVirtualization={false} />
 */
export const ConversationList = memo(
  ({
    conversations: externalConversations,
    onSelect,
    emptyState,
    isLoading: externalIsLoading = false,
    style,
    className = '',
    autoFetch = true,
    onRetry,
    scrollRef: externalScrollRef,
    enableVirtualization = true,
    renderItemMeta,
    getConversationDisplayTitle,
  }: ConversationListProps) => {
    const { t } = useTranslation();

    // ==================== 状态获取 ====================
    const activeConversationId = useActiveConversationId();

    // ==================== 数据获取 ====================
    // 判断是否应该自动获取数据
    const shouldAutoFetch = autoFetch && externalConversations === undefined;

    // 使用 React Query 获取会话列表（InfiniteQuery 版本）
    const {
      data: fetchedConversations,
      isLoading: isFetching,
      error,
      refetch,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    } = useConversations({
      enabled: shouldAutoFetch,
    });

    // 触底加载：IntersectionObserver 监听底部哨兵元素
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!shouldAutoFetch || !hasNextPage) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [shouldAutoFetch, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ==================== 数据处理 ====================
    // 确定最终使用的会话列表
    const conversations = useMemo(
      () => externalConversations ?? fetchedConversations,
      [externalConversations, fetchedConversations],
    );

    // 确定最终的加载状态
    const isLoading = shouldAutoFetch ? isFetching : externalIsLoading;

    // 处理会话列表，解析激活状态
    const processedConversations = useMemo(() => {
      if (!conversations) {
        return null;
      }

      return conversations.map((conversation) =>
        resolveConversationActive(conversation, activeConversationId),
      );
    }, [conversations, activeConversationId]);

    // ==================== 虚拟滚动配置 ====================
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const scrollRef = externalScrollRef || internalScrollRef;

    // 始终调用 useVirtualizer hook（避免条件性调用 hook）
    // 当禁用虚拟滚动或会话数量较少时，count 设置为 0
    const shouldUseVirtualization =
      enableVirtualization &&
      processedConversations !== null &&
      processedConversations.length >= 20;

    const virtualizer = useVirtualizer({
      count: shouldUseVirtualization ? processedConversations.length : 0,
      getScrollElement: () => scrollRef.current,
      getItemKey: (index) => {
        const conversation = processedConversations?.[index];
        if (!conversation) return index;
        return getConversationHeightCacheKey(conversation) ?? index;
      },
      estimateSize: (index) => {
        const conversation = processedConversations?.[index];
        if (!conversation) return estimateConversationHeight();
        return (
          getCachedConversationHeight(conversation) ??
          estimateConversationHeight()
        );
      },
      measureElement: (element) => {
        if (!element) return 0;

        // 动态测量实际高度
        const height = element.getBoundingClientRect().height;
        // 缓存已测量的高度
        const dataIndex = Number(element.getAttribute('data-index'));

        if (
          dataIndex >= 0 &&
          processedConversations &&
          dataIndex < processedConversations.length
        ) {
          setCachedConversationHeight(
            processedConversations[dataIndex],
            height,
          );
        }

        return height;
      },
      gap: CONVERSATION_LIST_ITEM_GAP,
      overscan: 5, // 预渲染上下各 5 个元素
    });

    // ==================== 自动滚动到激活会话 ====================
    // 当 activeConversationId 更新时，自动滚动到对应会话位置
    useEffect(() => {
      if (
        !activeConversationId ||
        !processedConversations ||
        !shouldUseVirtualization
      ) {
        return;
      }

      // 找到激活会话在列表中的索引
      const activeIndex = processedConversations.findIndex(
        (conversation) => conversation.id === activeConversationId,
      );

      if (activeIndex >= 0) {
        // 使用虚拟滚动的 scrollToIndex 方法滚动到该位置
        // align: 'center' 将会话项滚动到视图中心
        virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
      }
    }, [
      activeConversationId,
      processedConversations,
      shouldUseVirtualization,
      virtualizer,
    ]);

    // ==================== 回调函数 ====================

    // 处理重试操作
    const handleRetry = useCallback(() => {
      if (onRetry) {
        onRetry();
      } else {
        refetch();
      }
    }, [onRetry, refetch]);

    // ==================== 渲染 ====================

    // 容器类名
    const containerClassName = useMemo(
      () => cn(DEFAULT_CONTAINER_CLASSNAME, className),
      [className],
    );

    // 默认空状态组件
    const defaultEmptyState = useMemo(
      () => (
        <EmptyState
          message={t('conversation.empty')}
          icon={
            <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500/30" />
          }
        />
      ),
      [t],
    );

    // 错误状态（仅在自动获取时显示）
    if (error && shouldAutoFetch) {
      return (
        <output className={containerClassName} aria-live="polite">
          <ErrorState
            message={t('conversation.error.loadFailed')}
            onRetry={handleRetry}
            retryText={t('common.retry')}
          />
        </output>
      );
    }

    // 加载状态
    if (isLoading) {
      return (
        <output className={containerClassName} aria-live="polite">
          <LoadingState message={t('common.loading')} />
        </output>
      );
    }

    // 空状态
    if (!processedConversations || processedConversations.length === 0) {
      return (
        <output className={containerClassName} aria-live="polite">
          {emptyState || defaultEmptyState}
        </output>
      );
    }

    // 如果禁用虚拟滚动或会话数量较少，使用传统渲染方式
    if (!shouldUseVirtualization) {
      return (
        <div ref={scrollRef} style={style} className={containerClassName}>
          {processedConversations.map((conversation) => (
            <div key={conversation.id}>
              <ConversationItem
                conversation={conversation}
                onSelect={onSelect}
                renderMeta={renderItemMeta}
                getConversationDisplayTitle={getConversationDisplayTitle}
              />
            </div>
          ))}
          {/* 触底加载哨兵 */}
          {shouldAutoFetch && (
            <div ref={sentinelRef} className="h-4" aria-hidden />
          )}
          {isFetchingNextPage && (
            <div className="py-2 text-center">
              <LoadingState message="" />
            </div>
          )}
        </div>
      );
    }

    // 使用虚拟滚动渲染
    const virtualItems = virtualizer.getVirtualItems();

    return (
      <div ref={scrollRef} style={style} className={containerClassName}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ConversationItem
                conversation={processedConversations[virtualItem.index]}
                onSelect={onSelect}
                renderMeta={renderItemMeta}
                getConversationDisplayTitle={getConversationDisplayTitle}
              />
            </div>
          ))}
        </div>
        {/* 触底加载哨兵（虚拟滚动模式） */}
        {shouldAutoFetch && (
          <div ref={sentinelRef} className="h-4" aria-hidden />
        )}
        {isFetchingNextPage && (
          <div className="py-2 text-center">
            <LoadingState message="" />
          </div>
        )}
      </div>
    );
  },
);

ConversationList.displayName = 'ConversationList';
