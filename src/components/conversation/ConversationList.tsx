import { memo, type ReactNode } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationItem } from './ConversationItem';

export interface ConversationListProps {
  /** 会话列表 */
  conversations?: Conversation[] | null;
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 空状态提示 */
  emptyState?: ReactNode;
  /** 加载状态 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
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
 * - 支持空状态和加载状态。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationList = memo(
  ({
    conversations,
    onSelect,
    emptyState,
    isLoading = false,
    className = '',
  }: ConversationListProps) => {
    // 容器类名
    const containerClassName =
      `px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 ${className}`.trim();

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
