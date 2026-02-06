import {
  type ChangeEvent,
  forwardRef,
  type ReactNode,
  useCallback,
} from 'react';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface SearchInputProps {
  /** 搜索值 */
  value?: string;
  /** 搜索回调 */
  onChange?: (value: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 输入框名称 */
  name?: string;
  /** 图标 */
  icon?: ReactNode;
  /** 大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示边框 */
  bordered?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
} as const;

/**
 * SearchInput：通用搜索输入框组件
 *
 * @description
 * 可复用的搜索输入框组件，支持自定义图标、大小和样式。
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchQuery}
 *   onChange={(value) => console.log(value)}
 *   placeholder="搜索..."
 *   icon={<Search />}
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value = '',
      onChange,
      placeholder,
      className,
      disabled = false,
      name,
      icon,
      size = 'md',
      bordered = false,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event.target.value);
      },
      [onChange],
    );

    // 使用翻译的占位符，如果没有提供自定义占位符
    const resolvedPlaceholder = placeholder ?? t('search.placeholder');

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className={cn(
            // 基础样式
            'w-full rounded-lg outline-none transition-all',
            // 背景和边框
            bordered
              ? 'border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/40'
              : 'border border-transparent bg-muted focus:ring-1 focus:ring-primary/30',
            // 文本样式
            'text-text placeholder:text-text-muted/50',
            // 禁用状态
            'disabled:cursor-not-allowed disabled:opacity-50',
            // 尺寸样式
            sizeClasses[size],
            // 自定义样式
            className,
          )}
          style={icon ? { paddingRight: '2rem' } : undefined}
        />
        {icon && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
