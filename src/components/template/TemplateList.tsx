import { ChevronRight } from 'lucide-react';
import type { Template } from '@/interfaces/template.interface';
import { cn } from '@/utils/class.util';

export interface TemplateListProps {
  /** 模板列表 */
  templates: Template[];
  /** 点击模板回调 */
  onTemplateClick?: (template: Template) => void;
  /** 选中的模板 ID */
  selectedId?: string;
  /** 是否显示分类标签 */
  showCategory?: boolean;
  /** 是否显示使用次数 */
  showUsageCount?: boolean;
}

/**
 * TemplateList：模板列表组件
 *
 * 用于展示和选择消息模板的列表组件
 *
 * @example
 * ```tsx
 * <TemplateList
 *   templates={templates}
 *   onTemplateClick={(template) => console.log(template)}
 *   selectedId="template-1"
 *   showCategory
 *   showUsageCount
 * />
 * ```
 */
export const TemplateList = ({
  templates,
  onTemplateClick,
  selectedId,
  showCategory = true,
  showUsageCount = false,
}: TemplateListProps) => {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-sm text-gray-400 dark:text-gray-500">暂无模板</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="listbox" aria-label="模板列表">
      {templates.map((template) => {
        const isSelected = template.id === selectedId;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplateClick?.(template)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border border-gray-200/50 dark:border-white/10',
              'bg-card px-3 py-2 text-left text-sm',
              'transition hover:border-primary/50',
              isSelected && 'border-primary bg-primary/5',
            )}
            role="option"
            aria-selected={isSelected}
          >
            <div className="flex flex-1 flex-col gap-1 text-gray-600 hover:text-gray-800 dark:text-white">
              {/* 标题和分类 */}
              {template.name || (showCategory && template.category) ? (
                <div className="flex items-center gap-2">
                  {template.name && (
                    <span className="font-medium break-all">
                      {template.name}
                    </span>
                  )}
                  {showCategory && template.category && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                      {template.category}
                    </span>
                  )}
                </div>
              ) : null}

              {/* 内容预览 */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {template.content}
              </p>

              {/* 使用次数 */}
              {showUsageCount && template.usageCount !== undefined && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  使用 {template.usageCount} 次
                </p>
              )}
            </div>

            <ChevronRight
              className={cn(
                'h-3 w-3 shrink-0 text-gray-400 dark:text-gray-500',
                'transition-transform',
                isSelected && 'text-primary',
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
