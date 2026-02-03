import { FileText } from 'lucide-react';
import { cn } from '@/utils/class.util';

export const ProfileSearch = () => {
  return (
    <div className="border-t border-border px-4 py-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search or create template..."
          className={cn(
            'w-full rounded-lg border border-transparent bg-muted px-3 py-2',
            'text-xs text-text outline-none focus:ring-1 focus:ring-primary/30',
          )}
        />
        <FileText className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
};
