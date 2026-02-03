import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  type ReactNode,
  useCallback,
} from 'react';
import { cn } from '@/utils/class.util';

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
    // 处理搜索输入变化
    const handleSearchChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange?.(event.target.value);
      },
      [onSearchChange],
    );

    // 处理搜索提交
    const handleSearchKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && onSearchSubmit) {
          onSearchSubmit(searchValue);
        }
      },
      [onSearchSubmit, searchValue],
    );

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
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className={cn(
                'w-full bg-gray-200/50 dark:bg-white/10 border-none rounded-xl px-4 py-2 text-sm focus:bg-white dark:focus:bg-black/40',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-gray-900 dark:text-white placeholder-gray-500',
              )}
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
