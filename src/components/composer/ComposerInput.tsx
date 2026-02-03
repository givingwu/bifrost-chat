import { Smile } from 'lucide-react';
import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  memo,
  useEffect,
  useRef,
} from 'react';
import { cn } from '@/utils/class.util';
import {
  ARIA_LABELS,
  BUTTON_SIZES,
  TEST_IDS,
  TEXT_SIZES,
} from './composer.constants';

export interface ComposerInputProps {
  /** 输入框值 */
  value: string;
  /** 输入框值变更回调 */
  onChange: (value: string) => void;
  /** 回车回调 */
  onEnter?: () => void;
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
export const ComposerInput = memo<ComposerInputProps>(
  ({
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
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // 使用 useEffect 处理自动聚焦，避免使用 autoFocus 属性
    useEffect(() => {
      if (autoFocus && inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    }, [autoFocus, disabled]);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      // 仅在非禁用状态下处理
      if (disabled) {
        return;
      }

      // Enter 发送，Shift+Enter 换行
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        // 仅在有内容时触发发送
        if (value.trim().length > 0) {
          onEnter?.();
        }
      }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    };

    const handleEmojiClick = () => {
      onEmojiClick?.();
      // TODO: 实现表情选择器功能
      if (!onEmojiClick) {
        console.warn('Emoji picker not implemented yet');
      }
    };

    return (
      <div className="relative flex-1">
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
        <button
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
        </button>
      </div>
    );
  },
);

ComposerInput.displayName = 'ComposerInput';
