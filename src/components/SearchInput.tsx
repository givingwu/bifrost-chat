import { X } from 'lucide-react';
import {
  type ChangeEvent,
  forwardRef,
  memo,
  type ReactNode,
  useCallback,
} from 'react';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface SearchInputProps
  extends Omit<Partial<HTMLInputElement>, 'size'> {
  /** 搜索回调 */
  onChange?: (value: string) => void;
  /** 回车回调 */
  onEnter?: (value: string) => void;
  /** 图标 */
  icon?: ReactNode;
  /** 大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示边框 */
  bordered?: boolean;
  /** 支持清空 */
  clearable?: boolean;
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
 * 可复用的搜索输入框组件， *
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
export const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(
    (
      {
        value = '',
        type = 'text',
        onChange,
        onEnter,
        placeholder,
        className,
        disabled = false,
        name,
        icon,
        size = 'md',
        bordered = false,
        clearable = false,
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

      const handleClear = useCallback(() => {
        onChange?.('');
      }, [onChange]);

      const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' && onEnter) {
            onEnter(value);
          }
        },
        [onEnter, value],
      );

      // 使用翻译的占位符，如果没有提供自定义占位符
      const resolvedPlaceholder = placeholder ?? t('search.placeholder');

      const hasValue = value.length > 0;
      const showClearButton = clearable && hasValue && !disabled;
      const showIcon = icon && !showClearButton;

      return (
        <div className="relative">
          <input
            ref={ref}
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
            className={cn(
              'appearance-none border border-gray-300',
              '[&::-webkit-search-cancel-button]:hidden',
              '[&::-webkit-search-results-button]:hidden',
              '[&::-webkit-search-results-decoration]:hidden',
              '[&::-ms-clear]:hidden',
              'w-full bg-gray-200/50 dark:bg-white/10 border-none rounded-xl px-4 py-2 text-sm',
              'focus:bg-white dark:focus:bg-black/40',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all',
              'text-gray-900 dark:text-white placeholder-gray-500',
              // 背景和边框
              bordered
                ? 'border focus:border-primary'
                : 'border border-transparent',
              // 文本样式
              'text-text placeholder:text-gray-500/50',
              // 禁用状态
              'disabled:cursor-not-allowed disabled:opacity-50',
              // 尺寸样式
              sizeClasses[size],
              // 自定义样式
              className,
            )}
            aria-label={t('common.search')}
            style={
              showIcon || showClearButton ? { paddingRight: '2rem' } : undefined
            }
          />
          {showIcon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 right-2',
              )}
            >
              {icon}
            </div>
          )}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-200/50 hover:text-text dark:hover:bg-white/10"
              aria-label={t('common.clear')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    },
  ),
);

SearchInput.displayName = 'SearchInput';
