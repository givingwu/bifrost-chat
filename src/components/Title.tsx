import { memo } from 'react';
import { cn } from '@/utils/class.util';

export interface TitleProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 语义化标签 */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Title：标题组件
 *
 * @description
 * 通用标题组件，支持自定义语义化标签和样式。
 *
 * @example
 * ```tsx
 * <Title>默认标题</Title>
 * ```
 *
 * @example 使用自定义标签
 * ```tsx
 * <Title as="h1">一级标题</Title>
 * ```
 *
 * @example 使用自定义样式
 * ```tsx
 * <Title className="text-blue-500">自定义颜色标题</Title>
 * ```
 */
export const Title = memo(
  ({ children, className, as: Component = 'h2' }: TitleProps) => {
    return (
      <Component
        className={cn(
          'text-2xl font-semibold tracking-tight text-gray-900 dark:text-white',
          className,
        )}
      >
        {children}
      </Component>
    );
  },
);

Title.displayName = 'Title';
