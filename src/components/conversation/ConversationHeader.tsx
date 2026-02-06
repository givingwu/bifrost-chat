import { memo, type ReactNode } from 'react';
import { cn } from '@/utils/class.util';
import { SearchInput } from '../SearchInput';

export interface ConversationHeaderProps {
  /** 自定义类名 */
  className?: string;
  /** 标题 */
  title?: ReactNode;
  /** 子组件 */
  children?: ReactNode;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 搜索框值 */
  searchValue?: string;
  /** 搜索回调 */
  onSearchChange?: (value: string) => void;
  /** 搜索提交回调 */
  onSearchSubmit?: (value: string) => void;
}

/**
 * ConversationHeader：会话列表头部组件。
 * - 显示标题和搜索框。
 * - 支持自定义标题和搜索功能。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationHeader = memo(
  ({
    className = '',
    title,
    children,
    showSearch = true,
    searchPlaceholder = 'Search',
    searchValue = '',
    onSearchChange,
    onSearchSubmit,
  }: ConversationHeaderProps) => {
    return (
      <div className={cn('p-4 pt-6 pb-2 space-y-4', className)}>
        {title &&
          (typeof title === 'string' ? (
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
          ) : (
            title
          ))}

        {showSearch && (
          <div className="relative" data-component="conversation-list-search">
            <SearchInput
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              onEnter={onSearchSubmit}
              clearable
              aria-label="搜索会话"
            />
          </div>
        )}

        {children}
      </div>
    );
  },
);

ConversationHeader.displayName = 'ConversationHeader';
