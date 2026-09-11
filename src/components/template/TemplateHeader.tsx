import { SearchInput } from '@/components/SearchInput';
import { useTranslation } from '@/providers/I18n.provider';
import { TemplateCategoryButton } from './TemplateCategoryButton';

export interface TemplateHeaderProps {
  /** 搜索关键词 */
  searchQuery: string;
  /** 搜索回调 */
  onSearchChange: (value: string) => void;
  /** 分类列表 */
  categories: string[];
  /** 选中的分类 */
  selectedCategory?: string;
  /** 选择分类回调 */
  onCategorySelect: (category?: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * TemplateHeader 组件
 *
 * 模板面板的头部，包含搜索框和分类过滤
 *
 * @example
 * ```tsx
 * <TemplateHeader
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   categories={['分类1', '分类2']}
 *   selectedCategory="分类1"
 *   onCategorySelect={(category) => console.log(category)}
 * />
 * ```
 */
export const TemplateHeader = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategorySelect,
  className,
}: TemplateHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className={className || 'px-4 pt-4'}>
      {/* 搜索框 */}
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={t('template.search')}
        clearable
      />

      {/* 分类过滤 */}
      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <TemplateCategoryButton
            isSelected={!selectedCategory}
            onClick={() => onCategorySelect(undefined)}
            label={t('template.panel.allCategories')}
          />
          {categories.map((category) => (
            <TemplateCategoryButton
              key={category}
              isSelected={selectedCategory === category}
              onClick={() => onCategorySelect(category)}
              label={category}
            />
          ))}
        </div>
      )}
    </div>
  );
};
