import type { PropsWithChildren } from 'react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/utils/class.util';

export interface TooltipProps extends PropsWithChildren {
  /** 工具提示内容 */
  content: string;
  /** 显示位置 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 显示延迟（毫秒） */
  delay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的类名 */
  className?: string;
}

/**
 * Tooltip：工具提示组件
 *
 * @description
 * 支持多方向定位、延迟显示、亮/暗色模式
 *
 * @example
 * ```tsx
 * <Tooltip content="SMS" position="top">
 *   <Smartphone className="h-4 w-4" />
 * </Tooltip>
 * ```
 */
export const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  disabled = false,
  className,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(
    `tooltip-${Math.random().toString(36).substr(2, 9)}`,
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMouseEnter();
      }
    },
    [disabled, handleMouseEnter],
  );

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'border-l-transparent border-r-transparent border-b-gray-900 dark:border-b-white',
    bottom:
      'border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-white',
    left: 'border-t-transparent border-b-transparent border-r-gray-900 dark:border-r-white',
    right:
      'border-t-transparent border-b-transparent border-l-gray-900 dark:border-l-white',
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper needs to handle mouse/keyboard events for accessibility
    <div
      className="relative inline-block"
      tabIndex={disabled ? -1 : 0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onKeyDown={handleKeyDown}
      aria-describedby={isVisible ? tooltipId.current : undefined}
    >
      {children}
      {isVisible && (
        <div
          id={tooltipId.current}
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white whitespace-nowrap rounded-md shadow-lg',
            'bg-gray-900/90 dark:bg-white/90',
            'text-gray-50 dark:text-gray-900',
            'transition-opacity duration-200',
            positionClasses[position],
            className,
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position],
              'border-gray-900 dark:border-white',
            )}
          />
        </div>
      )}
    </div>
  );
};
