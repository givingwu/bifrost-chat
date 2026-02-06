import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

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
 * 通用的加载状态组件
 *
 * @example
 * ```tsx
 * <LoadingState message="Loading..." />
 * ```
 */
export const LoadingState = ({
  message = 'Loading...',
  icon,
  className,
}: LoadingStateProps) => {
  return (
    <div
      className={className || 'flex flex-col items-center justify-center py-8'}
    >
      {icon || <Loader2 className="h-8 w-8 animate-spin text-primary" />}
      {message && <p className="mt-2 text-sm text-text-muted">{message}</p>}
    </div>
  );
};
