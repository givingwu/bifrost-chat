import { Loader2 } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface LoadingStateProps {
  /** 加载提示信息 */
  message?: string;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * LoadingState 组件
 *
 * 通用的加载状态组件， *
 * @example
 * ```tsx
 * <LoadingState message="加载中..." />
 * ```
 *
 * @example 使用自定义图标
 * ```tsx
 * <LoadingState
 *   message="正在获取数据..."
 *   icon={<CustomSpinner />}
 * />
 * ```
 */
export const LoadingState = memo(
  ({ message = 'Loading...', icon, className }: LoadingStateProps) => {
    return (
      <output
        className={cn(
          'flex flex-col items-center justify-center py-8',
          className,
        )}
        aria-live="polite"
        aria-busy="true"
      >
        {icon || <Loader2 className="h-8 w-8 animate-spin text-primary" />}
        {message && (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {message}
          </p>
        )}
      </output>
    );
  },
);

LoadingState.displayName = 'LoadingState';
