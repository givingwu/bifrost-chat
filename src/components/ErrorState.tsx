import { AlertCircle } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { cn } from '@/utils/class.util';

export interface ErrorStateProps {
  /** 错误提示信息 */
  message?: string;
  /** 重试回调 */
  onRetry?: () => void;
  /** 重试按钮文本 */
  retryText?: string;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * ErrorState 组件
 *
 * 通用的错误状态组件， *
 * @example
 * ```tsx
 * <ErrorState
 *   message="加载失败"
 *   onRetry={() => console.log('重试')}
 *   retryText="重试"
 * />
 * ```
 */
export const ErrorState = memo(
  ({
    message = 'Load Failed',
    onRetry,
    retryText = 'Retry',
    icon,
    className,
  }: ErrorStateProps) => {
    return (
      <output
        className={cn(
          'flex flex-col items-center justify-center py-8',
          className,
        )}
        aria-live="polite"
      >
        {icon || <AlertCircle className="h-12 w-12 text-destructive/30" />}
        {message && (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {message}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            {retryText}
          </Button>
        )}
      </output>
    );
  },
);

ErrorState.displayName = 'ErrorState';
