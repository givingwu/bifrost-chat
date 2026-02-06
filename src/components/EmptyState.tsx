import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';

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
 * 通用的空状态组件
 *
 * @example
 * ```tsx
 * <EmptyState message="暂无数据" />
 * ```
 */
export const EmptyState = ({
  message = 'No Data',
  icon,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={className || 'flex flex-col items-center justify-center py-8'}
    >
      {icon || <FileText className="h-12 w-12 text-text-muted/30" />}
      {message && <p className="mt-2 text-sm text-text-muted">{message}</p>}
    </div>
  );
};
