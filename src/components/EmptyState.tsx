import { FileText } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface EmptyStateProps {
  /** 空状态提示信息 */
  message?: string;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * EmptyState 组件
 *
 * 通用的空状态组件，用于显示无数据时的提示信息。
 *
 * @example
 * ```tsx
 * <EmptyState message="暂无数据" />
 * ```
 *
 * @example 使用自定义图标
 * ```tsx
 * <EmptyState
 *   message="暂无会话"
 *   icon={<MessageCircle className="h-12 w-12 text-gray-400" />}
 * />
 * ```
 */
export const EmptyState = memo(
  ({ message = 'No Data', icon, className }: EmptyStateProps) => {
    return (
      <output
        className={cn(
          'flex flex-col items-center justify-center py-8',
          className,
        )}
        aria-live="polite"
      >
        {icon || (
          <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500/30" />
        )}
        {message && (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {message}
          </p>
        )}
      </output>
    );
  },
);

EmptyState.displayName = 'EmptyState';
