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
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  /** 聚焦回调 */
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
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
 * 消息输入框，使用 textarea 支持多行输入，自动高度调整。
 * 支持 Enter 发送、Shift+Enter 换行、表情选择。
 *
 * @example
 * ```tsx
 * <ComposerInput
 *   value={message}
 *   onChange={setMessage}
 *   onEnter={handleSend}
 *   placeholder="输入消息..."
 *   maxLength={2000}
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
      onMaxLengthReached,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 暴露 ref 方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          textareaRef.current?.focus();
        },
        blur: () => {
          textareaRef.current?.blur();
        },
      }),
      [],
    );

    // 自动聚焦
    useEffect(() => {
      if (autoFocus && textareaRef.current && !disabled) {
        textareaRef.current.focus();
      }
    }, [autoFocus, disabled]);

    // 键盘事件处理
    const handleKeyDown = useCallback(
      async (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
              textareaRef.current?.focus();
            });
          } catch (error) {
            debugLog.error('Failed to send message:', error);
            // 错误时仍保持焦点
            textareaRef.current?.focus();
          }
        }
      },
      [disabled, onEnter, value],
    );

    // 输入变更处理
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;

        // 检查是否达到最大长度
        if (newValue.length >= maxLength && value.length < maxLength) {
          onMaxLengthReached?.();
        }

        onChange(newValue);
      },
      [maxLength, onChange, onMaxLengthReached, value.length],
    );

    // 输入框是否接近或达到最大长度
    const isNearMaxLength = value.length >= maxLength * 0.9;
    const isAtMaxLength = value.length >= maxLength;

    return (
      <fieldset className="border-0 p-0 m-0">
        <textarea
          ref={textareaRef}
          rows={3}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-sm border border-transparent bg-gray-200/50 dark:bg-white/10 px-2 py-1.5',
            TEXT_SIZES.INPUT,
            'text-text dark:text-white outline-none transition-all duration-200',
            'focus:bg-card focus:ring-2 focus:ring-primary/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-gray-500/50 resize-none',
            // 字符数接近或达到最大长度时的视觉反馈
            isNearMaxLength && !isAtMaxLength && 'focus:ring-orange-400/40',
            isAtMaxLength && 'focus:ring-red-400/40',
          )}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-label="消息输入框"
          aria-invalid={isAtMaxLength}
          data-testid={TEST_IDS.COMPOSER_INPUT}
        />
      </fieldset>
    );
  },
);

ComposerInput.displayName = 'ComposerInput';
