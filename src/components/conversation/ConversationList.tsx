import { MessageCircle } from 'lucide-react';
import { memo, type ReactNode, useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useActiveConversationId } from '@/store';
import { cn } from '@/utils/class.util';
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
 *
 * @example
 * // 自动获取数据（推荐）
 * <ConversationList onSelect={(id) => console.log(id)} />
 *
 * // 手动传入数据（用于测试）
 * <ConversationList conversations={mockData} onSelect={(id) => console.log(id)} />
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
  }: ConversationListProps) => {
    const { t } = useTranslation();

    // ==================== 状态获取 ====================
    const activeConversationId = useActiveConversationId();

    // ==================== 数据获取 ====================
    // 判断是否应该自动获取数据
    const shouldAutoFetch = autoFetch && externalConversations === undefined;

    // 使用 React Query 获取会话列表
    const {
      data: fetchedConversations,
      isLoading: isFetching,
      error,
      refetch,
    } = useConversations({
      enabled: shouldAutoFetch,
    });

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
          icon={<MessageCircle className="h-12 w-12 text-text-muted/30" />}
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

    // 会话列表
    return (
      <ul
        style={style}
        className={containerClassName}
        aria-label={t('conversation.title')}
      >
        {processedConversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationItem conversation={conversation} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    );
  },
);

ConversationList.displayName = 'ConversationList';
