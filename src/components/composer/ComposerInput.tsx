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
import { cn } from '@/utils/class.util';
import { Button } from '../Button';
import {
  ARIA_LABELS,
  BUTTON_SIZES,
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
}

/**
 * ComposerInput 组件
 *
 * 消息输入框，支持回车发送、Shift+Enter 换行
 *
 * @example
 * ```tsx
 * <ComposerInput
 *   value={message}
 *   onChange={setMessage}
 *   onEnter={handleSend}
 *   placeholder="Type a message..."
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
      maxLength = 2000,
      autoFocus = false,
      onBlur,
      onFocus,
      onEmojiClick,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    // 暴露 focus 方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
      }),
      [],
    );

    // 使用 useEffect 处理自动聚焦，避免使用 autoFocus 属性
    useEffect(() => {
      if (autoFocus && inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    }, [autoFocus, disabled]);

    // 禁用时自动关闭表情选择器
    useEffect(() => {
      if (disabled) {
        setIsEmojiPickerOpen(false);
      }
    }, [disabled]);

    // 处理表情选择器外部点击和 ESC 关闭
    useEffect(() => {
      if (!isEmojiPickerOpen) {
        return;
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsEmojiPickerOpen(false);
        }
      };

      const handleEscape = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setIsEmojiPickerOpen(false);
          inputRef.current?.focus();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isEmojiPickerOpen]);

    const handleKeyDown = useCallback(
      async (event: KeyboardEvent<HTMLInputElement>) => {
        // 仅在非禁用状态下处理
        if (disabled) {
          return;
        }

        // Enter 发送，Shift+Enter 换行
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          // 仅在有内容时触发发送
          if (value.trim().length > 0) {
            // 等待 onEnter 完成（支持异步操作）
            await onEnter?.();
            // 发送完成后自动聚焦输入框
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          }
        }
      },
      [disabled, onEnter, value],
    );

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    };

    const handleEmojiSelect = useCallback(
      (emoji: string) => {
        if (disabled) {
          return;
        }

        const input = inputRef.current;
        if (!input) {
          onChange(`${value}${emoji}`);
          setIsEmojiPickerOpen(false);
          return;
        }

        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;
        const nextValue = value.slice(0, start) + emoji + value.slice(end);

        onChange(nextValue);
        setIsEmojiPickerOpen(false);

        requestAnimationFrame(() => {
          input.focus();
          const cursorPosition = start + emoji.length;
          input.setSelectionRange(cursorPosition, cursorPosition);
        });
      },
      [disabled, onChange, value],
    );

    const handleEmojiClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          return;
        }

        // 阻止事件冒泡，防止触发父元素的点击事件
        event.preventDefault();
        event.stopPropagation();

        onEmojiClick?.();
        setIsEmojiPickerOpen((prevOpen) => !prevOpen);
      },
      [disabled, onEmojiClick],
    );

    return (
      <div ref={containerRef} className="relative flex-1">
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
          )}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-label={ARIA_LABELS.COMPOSER_INPUT}
          data-testid={TEST_IDS.COMPOSER_INPUT}
        />

        <Button
          type="button"
          disabled={disabled}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'text-text-muted transition-colors duration-200',
            'hover:text-text',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full',
          )}
          onClick={handleEmojiClick}
          aria-label={ARIA_LABELS.EMOJI}
          data-testid={TEST_IDS.COMPOSER_EMOJI}
        >
          <Smile className={BUTTON_SIZES.ICON_MEDIUM} />
        </Button>

        <EmojiPicker
          open={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onEmojiSelect={handleEmojiSelect}
        />
      </div>
    );
  },
);

ComposerInput.displayName = 'ComposerInput';
