import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface MobileHeaderProps {
  title: ReactNode;
  subTitle: ReactNode;
  avatarUrl: string | undefined;
  showCloseButton: boolean;
  onClose?: () => void;
}

export function MobileHeader({
  title,
  subTitle,
  avatarUrl,
  showCloseButton,
  onClose,
}: MobileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        'relative z-10 flex min-h-20 shrink-0 items-center justify-between gap-4',
        'bg-card/80 px-5 py-3 shadow-soft backdrop-blur-md',
        'dark:bg-gray-900/50',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold leading-5 text-gray-600 dark:text-gray-400">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {subTitle}
          </p>
        </div>
      </div>

      {showCloseButton && (
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
