import { memo, type ReactNode } from 'react';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationItem } from './ConversationItem';

export interface ConversationListProps {
  /** 会话列表（可选，如果不提供则自动获取） */
  conversations?: Conversation[] | null;
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 空状态提示 */
  emptyState?: ReactNode;
  /** 加载状态（仅在手动提供 conversations 时有效） */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否自动获取数据（默认 true） */
  autoFetch?: boolean;
}

/**
 * 默认空状态组件
 */
const DefaultEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <title>暂无会话</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">暂无会话</p>
  </div>
);

/**
 * 加载状态组件
 */
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

/**
 * ConversationList：会话列表组件。
 * - 显示会话列表。
 * - 支持自动获取数据（使用 useConversations Hook）。
 * - 支持手动传入数据（用于测试或特殊场景）。
 * - 支持空状态和加载状态。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
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
    className = '',
    autoFetch = true,
  }: ConversationListProps) => {
    // 自动获取数据（如果启用且没有手动提供数据）
    const shouldAutoFetch = autoFetch && externalConversations === undefined;
    const {
      data: fetchedConversations,
      isLoading: isFetching,
      error,
    } = useConversations({
      enabled: shouldAutoFetch,
    });

    // 确定最终使用的状态
    const conversations = externalConversations ?? fetchedConversations;
    const isLoading = shouldAutoFetch ? isFetching : externalIsLoading;

    // 容器类名
    const containerClassName =
      `px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 ${className}`.trim();

    // 错误状态（仅在自动获取时显示）
    if (error && shouldAutoFetch) {
      console.error('Failed to load conversations:', error);
      return (
        <output className={containerClassName} aria-live="polite">
          <div className="px-4 py-12 text-center text-red-500">
            加载失败，请重试
          </div>
        </output>
      );
    }

    // 加载状态
    if (isLoading) {
      return (
        <output className={containerClassName} aria-live="polite">
          <LoadingState />
        </output>
      );
    }

    // 空状态
    if (!conversations || conversations.length === 0) {
      return (
        <output className={containerClassName} aria-live="polite">
          {emptyState || <DefaultEmptyState />}
        </output>
      );
    }

    return (
      <ul className={containerClassName} aria-label="会话列表">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationItem conversation={conversation} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    );
  },
);

ConversationList.displayName = 'ConversationList';
