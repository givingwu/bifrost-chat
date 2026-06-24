import { FileText, Send } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { ComposerCharCount } from '@/components/composer/ComposerCharCount';
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

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            maxLength={maxLength}
            disabled={inputDisabled}
            className={cn(
              'w-full rounded-full border border-transparent',
              'bg-gray-200/50 dark:bg-white/10',
              'px-4 py-2 text-sm text-foreground outline-none',
              'placeholder:text-gray-500/50',
              'focus:bg-card focus:ring-2 focus:ring-primary/40',
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

          {showCharCount && (
            <div
              id={MOBILE_COMPOSER_CHAR_COUNT_ID}
              className="flex justify-end px-2 leading-none"
              aria-live="polite"
            >
              <ComposerCharCount
                currentLength={value.length}
                maxLength={maxLength}
              />
            </div>
          )}
        </div>

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
