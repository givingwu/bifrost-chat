import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 图标内容 */
  icon: ReactNode;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'muted';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 子元素（通常不使用，仅为了兼容） */
  children?: never;
}

const sizeClasses = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
} as const;

const variantClasses = {
  primary: 'bg-primary text-primary-foreground shadow-soft hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-muted/50',
  muted: 'bg-muted text-gray-400 dark:text-gray-500 hover:text-gray-600',
} as const;

/**
 * 图标按钮组件
 *
 * @example
 * ```tsx
 * <IconButton icon={<Send />} variant="primary" size="md" onClick={handleSend} />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      disabled = false,
      loading = false,
      className,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center',
          'rounded-full',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // 尺寸样式
          sizeClasses[size],
          // 变体样式
          variantClasses[variant],
          // 自定义样式
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <title>Loading</title>
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
