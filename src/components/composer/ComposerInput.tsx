import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { cn } from '@/utils/class.util';
import { INPUT_LIMITS, TEST_IDS, TEXT_SIZES } from './composer.constants';
import { EmojiPickerButton } from './EmojiPickerButton';

/**
 * ComposerInput 暴露的 ref 接口
 */
export interface ComposerInputRef {
  /** 聚焦输入框 */
  focus: () => void;
  /** 失焦输入框 */
  blur: () => void;
}

export interface ComposerInputProps {
  /** 输入框值 */
  value: string;
  /** 输入框值变更回调 */
  onChange: (value: string) => void;
  /** 回车回调，支持异步操作 */
  onEnter?: () => void | Promise<void>;
  /** 输入框占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最大长度 */
  maxLength?: number;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
  /** 失焦回调 */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** 聚焦回调 */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Emoji 按钮点击回调 */
  onEmojiClick?: () => void;
  /** 是否显示表情按钮 */
  showEmojiButton?: boolean;
  /** 是否显示字符计数 */
  showCharCount?: boolean;
  /** 达到最大长度时的回调 */
  onMaxLengthReached?: () => void;
}

/**
 * 开发环境日志工具
 */
const debugLog = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ComposerInput]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ComposerInput]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ComposerInput]', ...args);
  },
};

/**
 * ComposerInput 组件
 *
 * 消息输入框，支持回车发送、Shift+Enter 换行、表情选择
 *
 * @example
 * ```tsx
 * <ComposerInput
 *   value={message}
 *   onChange={setMessage}
 *   onEnter={handleSend}
 *   placeholder="输入消息..."
 *   maxLength={2000}
 *   showCharCount
 * />
 * ```
 */
export const ComposerInput = forwardRef<ComposerInputRef, ComposerInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      onEnter,
      disabled = false,
      maxLength = INPUT_LIMITS.DEFAULT_MAX_LENGTH,
      autoFocus = false,
      onBlur,
      onFocus,
      onEmojiClick,
      showEmojiButton = true,
      showCharCount = false,
      onMaxLengthReached,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // 暴露 ref 方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
        blur: () => {
          inputRef.current?.blur();
        },
      }),
      [],
    );

    // 自动聚焦
    useEffect(() => {
      if (autoFocus && inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    }, [autoFocus, disabled]);

    // 表情选择器逻辑
    const handleEmojiSelect = useCallback(
      (emoji: string) => {
        if (disabled) {
          return;
        }

        const input = inputRef.current;
        if (!input) {
          onChange(`${value}${emoji} `);
          return;
        }

        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;
        const emojiWithSpace = `${emoji} `;
        const nextValue =
          value.slice(0, start) + emojiWithSpace + value.slice(end);

        onChange(nextValue);

        // 恢复焦点并设置光标位置
        requestAnimationFrame(() => {
          input.focus();
          const cursorPosition = start + emojiWithSpace.length;
          input.setSelectionRange(cursorPosition, cursorPosition);
        });
      },
      [disabled, onChange, value],
    );

    // 键盘事件处理
    const handleKeyDown = useCallback(
      async (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) {
          return;
        }

        // Enter 发送，Shift+Enter 换行
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();

          // 仅在有内容时触发发送
          if (value.trim().length === 0) {
            return;
          }

          try {
            debugLog.log('Sending message...');
            await onEnter?.();
            debugLog.log('Message sent successfully');

            // 发送完成后自动聚焦输入框
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          } catch (error) {
            debugLog.error('Failed to send message:', error);
            // 错误时仍保持焦点
            inputRef.current?.focus();
          }
        }
      },
      [disabled, onEnter, value],
    );

    // 输入变更处理
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        // 检查是否达到最大长度
        if (newValue.length >= maxLength && value.length < maxLength) {
          onMaxLengthReached?.();
        }

        onChange(newValue);
      },
      [maxLength, onChange, onMaxLengthReached, value.length],
    );

    // 字符计数显示
    const charCount = (
      <span
        className={cn(
          'absolute right-14 top-1/2 -translate-y-1/2',
          'text-[10px] text-text-muted',
          'transition-opacity duration-200',
          value.length > 0 ? 'opacity-100' : 'opacity-0',
          value.length >= maxLength * 0.9
            ? 'text-orange-500'
            : value.length >= maxLength
              ? 'text-red-500'
              : '',
        )}
      >
        {value.length}/{maxLength}
      </span>
    );

    // 输入框是否接近或达到最大长度
    const isNearMaxLength = value.length >= maxLength * 0.9;
    const isAtMaxLength = value.length >= maxLength;

    return (
      <fieldset className="relative flex-1 border-0 p-0 m-0">
        <input
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-full border border-transparent bg-muted px-4 py-3',
            TEXT_SIZES.INPUT,
            'text-text outline-none transition-all duration-200',
            'focus:bg-card focus:ring-2 focus:ring-primary/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-text-muted/50',
            // 字符数接近或达到最大长度时的视觉反馈
            isNearMaxLength && !isAtMaxLength && 'focus:ring-orange-400/40',
            isAtMaxLength && 'focus:ring-red-400/40',
            // 为字符计数和表情按钮留出空间
            showCharCount && 'pr-28',
            !showCharCount && showEmojiButton && 'pr-14',
            !showCharCount && !showEmojiButton && 'pr-4',
          )}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-label="消息输入框"
          aria-describedby={
            showCharCount ? TEST_IDS.COMPOSER_CHAR_COUNT : undefined
          }
          aria-invalid={isAtMaxLength}
          data-testid={TEST_IDS.COMPOSER_INPUT}
        />

        {/* 字符计数 */}
        {showCharCount && maxLength !== Infinity && charCount}

        {/* 表情按钮 */}
        {showEmojiButton && (
          <EmojiPickerButton
            disabled={disabled}
            onEmojiSelect={handleEmojiSelect}
            onButtonClick={onEmojiClick}
            containerClassName="absolute inset-y-0 right-3 flex items-center"
          />
        )}
      </fieldset>
    );
  },
);

ComposerInput.displayName = 'ComposerInput';
