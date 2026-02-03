import { ChevronRight } from 'lucide-react';
import type { ProfileTemplate } from '@/interfaces/profile.interface';
import { cn } from '@/utils/class.util';
import { ProfileSectionTitle } from './ProfileSectionTitle';

interface ProfileTemplatesProps {
  templates: ProfileTemplate[];
  onTemplateClick?: (template: ProfileTemplate) => void;
}

export const ProfileTemplates = ({
  templates,
  onTemplateClick,
}: ProfileTemplatesProps) => {
  return (
    <div className="flex-1 border-t border-border px-4 py-4">
      <ProfileSectionTitle title="Quick Responses" />
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
