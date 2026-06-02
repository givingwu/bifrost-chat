import { FileText, Send } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { TEMPLATE_SHEET_ID, translateOrFallback } from '@/utils/mobile.util';

export interface MobileComposerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  maxLength: number | undefined;
  readOnly: boolean;
  inputDisabled: boolean;
  canSend: boolean;
  isTemplateSheetOpen: boolean;
  isTemplateButtonDisabled: boolean;
  onToggleTemplateSheet: () => void;
}

export function MobileComposer({
  inputRef,
  value,
  onValueChange,
  onSend,
  onKeyDown,
  placeholder,
  maxLength,
  readOnly,
  inputDisabled,
  canSend,
  isTemplateSheetOpen,
  isTemplateButtonDisabled,
  onToggleTemplateSheet,
}: MobileComposerProps) {
  const { t } = useTranslation();

  return (
    <footer className="shrink-0 border-t border-border bg-white/50 px-3 py-3 backdrop-blur-md dark:bg-gray-900/50">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onSend();
        }}
      >
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          onClick={onToggleTemplateSheet}
          aria-label={translateOrFallback(
            t,
            'mobile.template.open',
            '打开快捷话术模板',
          )}
          aria-expanded={isTemplateSheetOpen}
          aria-controls={TEMPLATE_SHEET_ID}
          disabled={isTemplateButtonDisabled}
        >
          <FileText className="h-5 w-5" aria-hidden="true" />
        </button>

        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          disabled={inputDisabled}
          className={cn(
            'min-w-0 flex-1 rounded-full border border-transparent',
            'bg-gray-200/50 dark:bg-white/10',
            'px-4 py-2 text-sm text-foreground outline-none',
            'placeholder:text-gray-500/50',
            'focus:bg-card focus:ring-2 focus:ring-primary/40',
            'disabled:cursor-not-allowed disabled:opacity-60',
            readOnly && 'cursor-not-allowed',
          )}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={t('composer.aria.input')}
        />

        <button
          type="submit"
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            'bg-(--mobile-accent-color) text-(--mobile-accent-foreground-color) shadow-soft',
            'transition-transform hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
          )}
          disabled={!canSend}
          aria-label={translateOrFallback(t, 'composer.aria.send', '发送消息')}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </footer>
  );
}
