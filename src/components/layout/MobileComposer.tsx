import { FileText, Send, X } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { ComposerCharCount } from '@/components/composer/ComposerCharCount';
import { TEST_IDS } from '@/components/composer/composer.constants';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { TEMPLATE_SHEET_ID, translateOrFallback } from '@/utils/mobile.util';

export interface MobileComposerProps {
  /** 输入框 DOM 引用，用于模板回填和发送后恢复焦点 */
  inputRef: RefObject<HTMLInputElement | null>;
  /** 当前输入内容 */
  value: string;
  /** 输入内容变更回调 */
  onValueChange: (value: string) => void;
  /** 清空当前输入内容 */
  onClear: () => void;
  /** 发送当前输入内容 */
  onSend: () => void;
  /** 输入框键盘事件处理 */
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** 输入框占位文案 */
  placeholder: string;
  /** 当前生效的字数提示上限；为空时表示不限制 */
  maxLength: number | undefined;
  /** 是否显示字符计数 */
  showCharCount?: boolean;
  /** 当前输入是否只读 */
  readOnly: boolean;
  /** 当前输入是否禁用 */
  inputDisabled: boolean;
  /** 当前是否允许发送 */
  canSend: boolean;
  /** 模板面板是否打开 */
  isTemplateSheetOpen: boolean;
  /** 模板入口是否禁用 */
  isTemplateButtonDisabled: boolean;
  /** 切换模板面板 */
  onToggleTemplateSheet: () => void;
}

const MOBILE_COMPOSER_CHAR_COUNT_ID = 'bifrost-mobile-composer-char-count';

/**
 * MobileComposer：移动端底部输入区。
 *
 * @description
 * 只负责渲染输入、模板入口、发送按钮与字数提示；长度规则由
 * `MobileLayout` 根据当前渠道和 composer 配置计算后传入。
 */
export function MobileComposer({
  inputRef,
  value,
  onValueChange,
  onClear,
  onSend,
  onKeyDown,
  placeholder,
  maxLength,
  showCharCount = true,
  readOnly,
  inputDisabled,
  canSend,
  isTemplateSheetOpen,
  isTemplateButtonDisabled,
  onToggleTemplateSheet,
}: MobileComposerProps) {
  const { t } = useTranslation();
  const safeLength = value?.length ?? 0;
  const isNearMaxLength =
    maxLength !== undefined && safeLength >= maxLength * 0.9;
  const isAtMaxLength = maxLength !== undefined && safeLength >= maxLength;
  const hasValue = safeLength > 0;

  return (
    <footer className="shrink-0 border-t border-border bg-white/50 px-3 py-3 backdrop-blur-md dark:bg-gray-900/50">
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          void onSend();
        }}
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div
            className={cn(
              'flex min-h-10 min-w-0 flex-1 items-center gap-1',
              'rounded-2xl border border-transparent',
              'bg-gray-200/50 dark:bg-white/10',
              'px-3 py-1.5 transition-all duration-200',
              'focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/40',
              inputDisabled && 'cursor-not-allowed opacity-60',
              readOnly && 'cursor-not-allowed',
              isNearMaxLength &&
                !isAtMaxLength &&
                'focus-within:ring-orange-400/40',
              isAtMaxLength && 'focus-within:ring-red-400/40',
            )}
          >
            <input
              ref={inputRef}
              value={value}
              placeholder={placeholder}
              readOnly={readOnly}
              disabled={inputDisabled}
              className={cn(
                'min-w-0 flex-1 bg-transparent px-0 py-0',
                'text-sm leading-6 text-foreground outline-none',
                'placeholder:text-gray-500/50',
                'disabled:cursor-not-allowed disabled:opacity-60',
                readOnly && 'cursor-not-allowed',
                isNearMaxLength && !isAtMaxLength && 'focus:ring-orange-400/40',
                isAtMaxLength && 'focus:ring-red-400/40',
              )}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label={t('composer.aria.input')}
              aria-describedby={
                showCharCount ? MOBILE_COMPOSER_CHAR_COUNT_ID : undefined
              }
              aria-invalid={isAtMaxLength || undefined}
            />

            {hasValue && (
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onClear}
                disabled={inputDisabled}
                aria-label={translateOrFallback(
                  t,
                  'composer.aria.clear',
                  '清空输入',
                )}
                data-testid={TEST_IDS.COMPOSER_CLEAR}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className={cn(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              'bg-(--mobile-accent-color) text-(--mobile-accent-foreground-color) shadow-soft',
              'transition-transform hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            )}
            disabled={!canSend}
            aria-label={translateOrFallback(
              t,
              'composer.aria.send',
              '发送消息',
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {showCharCount && (
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] gap-2">
            <span aria-hidden="true" />
            <div
              id={MOBILE_COMPOSER_CHAR_COUNT_ID}
              className="flex min-w-0 justify-end px-2 leading-none"
              aria-live="polite"
            >
              <ComposerCharCount
                currentLength={value.length}
                maxLength={maxLength}
              />
            </div>
            <span aria-hidden="true" />
          </div>
        )}
      </form>
    </footer>
  );
}
