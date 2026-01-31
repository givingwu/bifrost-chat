import { ChevronRight } from 'lucide-react';
import type { ContextTemplateItem } from '@/interfaces/context.interface';
import { cn } from '@/utils/class.util';
import { ContextPanelSectionTitle } from './ContextPanelSectionTitle';

interface ContextPanelTemplatesProps {
  templates: ContextTemplateItem[];
  onTemplateClick?: (template: ContextTemplateItem) => void;
}

export const ContextPanelTemplates = ({
  templates,
  onTemplateClick,
}: ContextPanelTemplatesProps) => {
  return (
    <div className="flex-1 border-t border-border px-4 py-4">
      <ContextPanelSectionTitle title="Quick Responses" />
      <div className="mt-3 space-y-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplateClick?.(template)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-border',
              'bg-card px-3 py-2 text-left text-sm text-text',
              'transition hover:border-primary/50',
            )}
          >
            <span className="line-clamp-1">{template.content}</span>
            <ChevronRight className="h-3 w-3 text-text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
};
