import { FileText, Search } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Template } from '@/interfaces/template.interface';
import { cn } from '@/utils/class.util';

export interface TemplatePickerProps {
  /** 模板列表 */
  templates: Template[];
  /** 选择模板的回调 */
  onTemplateSelect: (template: Template) => void;
  /** 是否显示 */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 位置坐标 */
  position?: { x: number; y: number };
}

/**
 * TemplatePicker 组件
 *
 * 消息模板选择器，支持搜索和选择模板
 *
 * @example
 * ```tsx
 * <TemplatePicker
 *   open={showTemplatePicker}
 *   templates={templates}
 *   onTemplateSelect={(template) => insertTemplate(template)}
 *   onClose={() => setShowTemplatePicker(false)}
 *   position={{ x: 100, y: 200 }}
 * />
 * ```
 */
export const TemplatePicker = memo<TemplatePickerProps>(
  ({ templates, onTemplateSelect, open = false, onClose, position }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // 过滤模板
    const filteredTemplates = useMemo(
      () =>
        templates.filter((template) => {
          const query = searchQuery.toLowerCase();
          const name = template.name.toLowerCase();
          const content = template.content.toLowerCase();
          const category = template.category?.toLowerCase() ?? '';
          const tags = template.tags?.join(' ').toLowerCase() ?? '';

          return (
            name.includes(query) ||
            content.includes(query) ||
            category.includes(query) ||
            tags.includes(query)
          );
        }),
      [templates, searchQuery],
    );

    // 重置选中索引（当过滤结果变化时）
    useEffect(() => {
      setSelectedIndex(0);
    }, []);

    // 键盘导航
    useEffect(() => {
      if (!open) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (filteredTemplates.length === 0) {
          return;
        }

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredTemplates.length - 1 ? prev + 1 : 0,
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredTemplates.length - 1,
            );
            break;
          case 'Enter':
            event.preventDefault();
            if (filteredTemplates[selectedIndex]) {
              onTemplateSelect(filteredTemplates[selectedIndex]);
            }
            break;
          case 'Escape':
            event.preventDefault();
            onClose?.();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, filteredTemplates, selectedIndex, onTemplateSelect, onClose]);

    // 点击外部关闭
    useEffect(() => {
      if (!open) {
        return;
      }

      const handleClickOutside = (event: Event) => {
        if (
          pickerRef.current &&
          !pickerRef.current.contains(event.target as Node)
        ) {
          onClose?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open, onClose]);

    if (!open) {
      return null;
    }

    return (
      <div
        ref={pickerRef}
        className={cn(
          'absolute z-50',
          'w-96 max-h-96 overflow-hidden',
          'rounded-xl border border-border bg-card shadow-lg',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        style={{
          left: position?.x ?? 0,
          top: position?.y ?? 0,
        }}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">消息模板</h3>
          </div>

          {/* 搜索框 */}
          <div className="mt-2 relative">
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
        </div>

        {/* 模板列表 */}
        <div className="overflow-y-auto py-2">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-text-muted/30" />
              <p className="mt-2 text-sm text-text-muted">
                {searchQuery ? '未找到匹配的模板' : '暂无模板'}
              </p>
            </div>
          ) : (
            filteredTemplates.map((template, index) => {
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplateSelect(template)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 px-4 py-3',
                    'transition-all duration-150',
                    'hover:bg-muted',
                    'focus:outline-none focus:bg-muted',
                    isSelected && 'bg-muted',
                  )}
                >
                  {/* 标题和分类 */}
                  <div className="flex w-full items-center gap-2">
                    <span className="truncate text-sm font-medium text-text">
                      {template.name}
                    </span>
                    {template.category && (
                      <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        {template.category}
                      </span>
                    )}
                  </div>

                  {/* 内容预览 */}
                  <p className="line-clamp-2 text-xs text-text-muted">
                    {template.content}
                  </p>

                  {/* 标签 */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 底部提示 */}
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-[10px] text-text-muted">
            使用 ↑↓ 选择，Enter 确认，ESC 关闭
          </p>
        </div>
      </div>
    );
  },
);

TemplatePicker.displayName = 'TemplatePicker';

/**
 * 插入模板到文本中
 */
export function insertTemplate(
  currentValue: string,
  template: Template,
): string {
  // 如果当前输入框为空，直接使用模板内容
  if (!currentValue.trim()) {
    return template.content;
  }

  // 如果有内容，在模板内容前添加换行
  return `${currentValue}\n${template.content}`;
}

/**
 * 预定义的消息模板
 */
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'greeting',
    name: '问候',
    category: '常用',
    content: '您好，有什么可以帮助您的吗？',
    tags: ['问候', '开场'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'thanks',
    name: '感谢',
    category: '常用',
    content: '非常感谢您的支持！',
    tags: ['感谢', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'follow-up',
    name: '跟进',
    category: '销售',
    content: '您好，我想跟进一下我们之前的沟通，请问您还有什么疑问吗？',
    tags: ['跟进', '销售'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'appointment',
    name: '预约',
    category: '业务',
    content: '您好，请问您方便安排一个时间进行详细沟通吗？',
    tags: ['预约', '沟通'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'closing',
    name: '结束语',
    category: '常用',
    content: '祝您生活愉快！',
    tags: ['结束语', '礼貌'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
