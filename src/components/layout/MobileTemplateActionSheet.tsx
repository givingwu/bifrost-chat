import { X } from 'lucide-react';
import type { Template } from '@/interfaces/template.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { formatTemplateLabel, TEMPLATE_SHEET_ID } from '@/utils/mobile.util';

export interface MobileTemplateActionSheetProps {
  templates: Template[];
  isLoading: boolean;
  queryError: Error | null;
  templateError: string | null;
  renderingTemplateId: string | undefined;
  onSelect: (template: Template) => void;
  onClose: () => void;
  onRetry: () => void;
}

export function MobileTemplateActionSheet({
  templates,
  isLoading,
  queryError,
  templateError,
  renderingTemplateId,
  onSelect,
  onClose,
  onRetry,
}: MobileTemplateActionSheetProps) {
  const { t } = useTranslation();
  const sheetTitle =
    t('mobile.template.title') !== 'mobile.template.title'
      ? t('mobile.template.title')
      : '选择快捷话术模板';

  return (
    <div
      data-component="mobile-template-action-sheet-overlay"
      className="pointer-events-none absolute inset-0 z-50"
    >
      <section
        id={TEMPLATE_SHEET_ID}
        role="dialog"
        aria-modal="true"
        aria-label={sheetTitle}
        className={cn(
          'pointer-events-auto absolute inset-x-0 bottom-24 mx-3 max-h-[52%]',
          'overflow-hidden rounded-t-2xl border border-border bg-card',
          'shadow-2xl',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {sheetTitle}
          </h3>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(52vh-56px)] overflow-y-auto px-4 pb-4">
          {templateError && (
            <p className="mb-3 rounded-md bg-error/10 px-3 py-2 text-xs text-error">
              {templateError}
            </p>
          )}

          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('template.panel.loading')}
            </p>
          ) : queryError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('template.panel.loadFailed')}
              </p>
              <button
                type="button"
                className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-foreground"
                onClick={onRetry}
              >
                {t('template.panel.retry')}
              </button>
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('template.panel.noTemplates')}
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => {
                const isRendering = renderingTemplateId === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center rounded-lg bg-muted/60 px-3 py-3',
                      'text-left text-sm text-foreground transition-colors',
                      'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40',
                      isRendering && 'cursor-wait opacity-70',
                    )}
                    onClick={() => void onSelect(template)}
                    disabled={isRendering}
                    aria-busy={isRendering}
                  >
                    <span className="line-clamp-1 break-all">
                      {formatTemplateLabel(template)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
