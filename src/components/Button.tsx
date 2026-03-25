import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/utils/class.util';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'muted' | 'plain';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否加载中 */
  loading?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
} as const;

const variantClasses = {
  primary: 'bg-primary text-primary-foreground shadow-soft hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-muted/50',
  muted: 'bg-muted text-gray-400 dark:text-gray-500 hover:text-gray-600',
  plain: 'bg-transparent',
} as const;

/**
 * Button：通用按钮组件
 *
 * @description
 * 基础按钮组件，支持多种变体和尺寸。
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   点击我
 * </Button>
 * ```
 */
export const Button = ({
  children,
  className,
  style,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  ...restProps
}: ButtonProps) => {
  return (
    <button
      type="button"
      {...restProps}
      style={style}
      disabled={disabled || loading}
      className={cn(
        'cursor-pointer inline-flex items-center justify-center',
        'rounded-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
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
        children
      )}
    </button>
  );
};

/**
 * CircularButton：圆形按钮组件
 *
 * @description
 * 圆形图标按钮，适用于工具栏等场景。
 *
 * @example
 * ```tsx
 * <CircularButton onClick={handleClick}>
 *   <Settings className="h-4 w-4" />
 * </CircularButton>
 * ```
 */
export const CircularButton = ({
  children,
  className,
  disabled = false,
  loading = false,
  ...restProps
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      data-component="circular-button"
      type="button"
      {...restProps}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center w-9 h-9 p-2',
        'cursor-pointer hover:bg-muted/60 hover:text-text',
        'transition-colors rounded-full',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
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
        children
      )}
    </button>
  );
};
