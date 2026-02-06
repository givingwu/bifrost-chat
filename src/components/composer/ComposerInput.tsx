import { Smile } from 'lucide-react';
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/Button';
import { cn } from '@/utils/class.util';
import {
  ARIA_LABELS,
  BUTTON_SIZES,
  INPUT_LIMITS,
  TEST_IDS,
  TEXT_SIZES,
} from './composer.constants';
import { EmojiPicker } from './EmojiPicker';

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
 * 表情选择器 Hook
 * 封装表情选择器的状态和交互逻辑
 */
const useEmojiPicker = (
  disabled: boolean,
  onEmojiSelect: (emoji: string) => void,
  onEmojiClick?: () => void,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLFieldSetElement>(null);

  // 使用 ref 存储回调，避免事件监听器重新绑定
  const callbacksRef = useRef({
    onEmojiSelect,
    onEmojiClick,
  });

  useEffect(() => {
    callbacksRef.current = { onEmojiSelect, onEmojiClick };
  });

  // 禁用时自动关闭表情选择器
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  // 处理外部点击和 ESC 键关闭
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        debugLog.warn('Emoji picker toggle ignored: disabled');
        return;
      }

      event.stopPropagation();
      callbacksRef.current.onEmojiClick?.();
      setIsOpen((prev) => !prev);
    },
    [disabled],
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    containerRef,
    toggle,
    close,
  };
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

    const emojiPicker = useEmojiPicker(
      disabled,
      handleEmojiSelect,
      onEmojiClick,
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
      <fieldset
        ref={emojiPicker.containerRef}
        className="relative flex-1 border-0 p-0 m-0"
        aria-label={ARIA_LABELS.COMPOSER_INPUT}
      >
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
          aria-label={ARIA_LABELS.COMPOSER_INPUT}
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
          <Button
            type="button"
            disabled={disabled}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'text-text-muted transition-all duration-200',
              'hover:text-text hover:scale-110',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
              'focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full',
              // 激活状态
              emojiPicker.isOpen && 'text-text rotate-12',
            )}
            onClick={emojiPicker.toggle}
            aria-label={ARIA_LABELS.EMOJI}
            aria-pressed={emojiPicker.isOpen}
            aria-haspopup="dialog"
            data-testid={TEST_IDS.COMPOSER_EMOJI}
          >
            <Smile className={BUTTON_SIZES.ICON_MEDIUM} />
          </Button>
        )}

        {/* 表情选择器 */}
        <EmojiPicker
          open={emojiPicker.isOpen}
          onClose={emojiPicker.close}
          onEmojiSelect={handleEmojiSelect}
        />
      </fieldset>
    );
  },
);

ComposerInput.displayName = 'ComposerInput';
