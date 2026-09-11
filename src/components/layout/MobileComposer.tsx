import { FileText, Send, X } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { ComposerCharCount } from '@/components/composer/ComposerCharCount';
import { TEST_IDS } from '@/components/composer/composer.constants';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { TEMPLATE_SHEET_ID, translateOrFallback } from '@/utils/mobile.util';

export interface MobileComposerProps {
  /** 输入框 DOM 引用，用于模板回填和发送后恢复焦点 */
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** 当前输入内容 */
  value: string;
  /** 输入内容变更回调 */
  onValueChange: (value: string) => void;
  /** 清空当前输入内容 */
  onClear: () => void;
  /** 发送当前输入内容 */
  onSend: () => void;
  /** 输入框键盘事件处理 */
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
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

// 单行高度约 24px (leading-6 = 1.5rem × 16px = 24px)
// 3 行最大高度约 72px
const SINGLE_LINE_HEIGHT = 24;
const MAX_ROWS = 3;
const MAX_HEIGHT = SINGLE_LINE_HEIGHT * MAX_ROWS;

/**
 * AutoExpandTextarea：自动扩展高度的 textarea。
 *
 * @description
 * 根据 content 自动调整高度，最小 1 行，最大 3 行。
 */
function AutoExpandTextarea({
  textareaRef,
  value,
  placeholder,
  readOnly,
  disabled,
  className,
  onChange,
  onKeyDown,
  ariaLabel,
  ariaInvalid,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  placeholder: string;
  readOnly: boolean;
  disabled: boolean;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  ariaLabel: string;
  ariaInvalid?: true | undefined;
}) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const previousValue = useRef(value);

  // 自动调整高度
  useEffect(() => {
    const textarea = textareaRef?.current || internalRef.current;
    if (!textarea) return;

    // 仅在内容实际变化时调整
    if (value === previousValue.current) return;
    previousValue.current = value;

    // 重置高度到最小值
    textarea.style.height = 'auto';

    // 计算新高度
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, MAX_HEIGHT);

    textarea.style.height = `${newHeight}px`;
  }, [value, textareaRef?.current]);

  return (
    <textarea
      ref={textareaRef || internalRef}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      rows={1}
      className={cn(
        // 基础样式
        'min-w-0 flex-1 bg-transparent px-0 py-0 resize-none',
        // 固定高度范围
        `min-h-[${SINGLE_LINE_HEIGHT}px] max-h-[${MAX_HEIGHT}px]`,
        // 字体样式
        'text-sm leading-6 text-foreground outline-none',
        // 占位符样式
        'placeholder:text-gray-500/50',
        // 禁用/只读状态
        'disabled:cursor-not-allowed disabled:opacity-60',
        'read-only:cursor-not-allowed',
        className,
      )}
      style={{
        minHeight: SINGLE_LINE_HEIGHT,
        maxHeight: MAX_HEIGHT,
        height: 'auto',
        overflowY: 'auto',
      }}
      onChange={onChange}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
    />
  );
}

/**
 * MobileComposer：移动端底部输入区。
 *
 * @description
 * - 使用 auto-expand textarea，最小 1 行，最大 3 行
 * - 高度固定，避免 clear 按钮导致抖动
 * - 字符计数显示在底部
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
        {/* 输入区：固定高度避免抖动 */}
        <div
          className={cn(
            'flex items-start gap-2',
            // 确保高度始终一致
            'min-h-[40px]',
          )}
        >
          {/* 模板按钮 */}
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* 输入框容器 */}
          <div
            className={cn(
              'flex min-h-9 min-w-0 flex-1 items-center gap-1.5',
              'rounded-2xl border border-transparent',
              'bg-gray-200/50 dark:bg-white/10',
              'px-3 py-1 transition-all duration-200',
              'focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/40',
              inputDisabled && 'cursor-not-allowed opacity-60',
              readOnly && 'cursor-not-allowed',
              isNearMaxLength &&
                !isAtMaxLength &&
                'focus-within:ring-orange-400/40',
              isAtMaxLength && 'focus-within:ring-red-400/40',
            )}
          >
            <AutoExpandTextarea
              textareaRef={inputRef}
              value={value}
              placeholder={placeholder}
              readOnly={readOnly}
              disabled={inputDisabled}
              className="py-1"
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={onKeyDown}
              ariaLabel={t('composer.aria.input')}
              ariaInvalid={isAtMaxLength || undefined}
            />

            {hasValue && (
              <button
                type="button"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 mt-0.5"
                onClick={onClear}
                disabled={inputDisabled}
                aria-label={translateOrFallback(
                  t,
                  'composer.aria.clear',
                  '清空输入',
                )}
                data-testid={TEST_IDS.COMPOSER_CLEAR}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* 发送按钮 */}
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
            aria-label={translateOrFallback(
              t,
              'composer.aria.send',
              '发送消息',
            )}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* 字符计数 */}
        {showCharCount && (
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] gap-2">
            <span aria-hidden="true" />
            <div
              id={MOBILE_COMPOSER_CHAR_COUNT_ID}
              className="flex min-w-0 justify-end px-2 leading-none text-xs text-muted-foreground"
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
