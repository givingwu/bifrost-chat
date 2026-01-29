import { Smile } from 'lucide-react';
import { cn } from '@/utils/class.util';

export const ComposerInput = ({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="relative flex-1">
      <input
        value={value}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-full border border-transparent bg-muted px-4 py-3',
          'text-sm text-text outline-none transition focus:bg-card',
          'focus:ring-2 focus:ring-primary/40',
        )}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text"
      >
        <Smile className="h-5 w-5" />
      </button>
    </div>
  );
};
