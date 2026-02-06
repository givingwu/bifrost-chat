import { FileText, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTemplates } from '@/hooks/use-templates.hook';
import type { Template } from '@/interfaces/template.interface';
import { cn } from '@/utils/class.util';
import { TemplateList } from './TemplateList';

export interface TemplatePanelProps {
  /** 选择模板的回调 */
  onTemplateSelect?: (template: Template) => void;
  /** 选中的模板 ID */
  selectedId?: string;
  /** 是否显示分类标签 */
  showCategory?: boolean;
  /** 是否显示使用次数 */
  showUsageCount?: boolean;
  /** 自定义模板列表（如果提供，则不使用 useTemplates） */
  templates?: Template[];
}

/**
 * TemplatePanel 组件
 *
 * 完整的模板面板，包含搜索、分类过滤和模板列表
 *
 * @example
 * ```tsx
 * <TemplatePanel
 *   onTemplateSelect={(template) => console.log(template)}
 *   selectedId="template-1"
 *   showCategory
 *   showUsageCount
 * />
 * ```
 */
export const TemplatePanel = ({
  onTemplateSelect,
  selectedId,
  showCategory = true,
  showUsageCount = false,
  templates: customTemplates,
}: TemplatePanelProps) => {
  // 使用自定义模板或从服务获取
  const { data: serverTemplates, isLoading, error } = useTemplates();
  const templates = customTemplates ?? serverTemplates ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();

  // 提取所有分类
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    templates.forEach((template: Template) => {
      if (template.category) {
        categorySet.add(template.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [templates]);

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    return templates.filter((template: Template) => {
      const query = searchQuery.toLowerCase();
      const name = template.name.toLowerCase();
      const content = template.content.toLowerCase();
      const category = template.category?.toLowerCase() ?? '';
      const tags = template.tags?.join(' ').toLowerCase() ?? '';

      const matchesSearch =
        name.includes(query) ||
        content.includes(query) ||
        category.includes(query) ||
        tags.includes(query);

      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  return (
    <div className="flex h-full flex-col">
      {/* 头部 */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">消息模板</h3>
          </div>
          {searchQuery || selectedCategory ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(undefined);
              }}
              className="rounded p-1 text-text-muted transition hover:bg-muted hover:text-text"
              aria-label="清除筛选"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* 搜索框 */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模板..."
            className={cn(
              'w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4',
              'text-sm text-text',
              'placeholder:text-text-muted/50',
              'outline-none transition-all duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/40',
            )}
          />
        </div>

        {/* 分类过滤 */}
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                'border',
                !selectedCategory
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-text hover:border-primary/50',
              )}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  'border',
                  selectedCategory === category
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-text hover:border-primary/50',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-text-muted">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-text-muted/30" />
            <p className="mt-2 text-sm text-text-muted">加载失败</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-text-muted/30" />
            <p className="mt-2 text-sm text-text-muted">
              {searchQuery || selectedCategory
                ? '未找到匹配的模板'
                : '暂无模板'}
            </p>
          </div>
        ) : (
          <TemplateList
            templates={filteredTemplates}
            onTemplateClick={onTemplateSelect}
            selectedId={selectedId}
            showCategory={showCategory}
            showUsageCount={showUsageCount}
          />
        )}
      </div>

      {/* 底部统计 */}
      {templates.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-[10px] text-text-muted">
            显示 {filteredTemplates.length} / {templates.length} 个模板
          </p>
        </div>
      )}
    </div>
  );
};
