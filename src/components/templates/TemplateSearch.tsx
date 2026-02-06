import { FileText } from 'lucide-react';
import { forwardRef } from 'react';
import { SearchInput } from '@/components/SearchInput';

export interface TemplateSearchProps {
  /** 搜索值 */
  value?: string;
  /** 搜索回调 */
  onSearch?: (query: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 输入框名称 */
  name?: string;
}

/**
 * TemplateSearch：模板搜索组件
 *
 * @description
 * 基于通用 SearchInput 组件的模板搜索，专门用于搜索和创建消息模板。
 *
 * @example
 * ```tsx
 * <TemplateSearch
 *   value={searchQuery}
 *   onSearch={(query) => console.log(query)}
 *   placeholder="搜索或创建模板..."
 * />
 * ```
 */
export const TemplateSearch = forwardRef<HTMLInputElement, TemplateSearchProps>(
  (
    {
      value = '',
      onSearch,
      placeholder = '搜索或创建模板...',
      className,
      disabled = false,
      name,
    },
    ref,
  ) => {
    return (
      <div className={className}>
        <SearchInput
          ref={ref}
          name={name}
          value={value}
          onChange={onSearch}
          placeholder={placeholder}
          disabled={disabled}
          size="sm"
          icon={<FileText className="h-3 w-3" />}
        />
      </div>
    );
  },
);

TemplateSearch.displayName = 'TemplateSearch';
