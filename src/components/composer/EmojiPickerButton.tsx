import { Smile } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { cn } from '@/utils/class.util';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';
import { EmojiPicker, type EmojiPickerProps } from './EmojiPicker';

/**
 * EmojiPickerButton 组件的 Props 接口
 */
export interface EmojiPickerButtonProps
  extends Omit<EmojiPickerProps, 'open' | 'onClose' | 'onEmojiSelect'> {
  /** 选择表情的回调 */
  onEmojiSelect: (emoji: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮点击回调（在打开/关闭前触发） */
  onButtonClick?: () => void;
  /** 自定义按钮类名 */
  buttonClassName?: string;
  /** 自定义容器类名 */
  containerClassName?: string;
}

/**
 * 开发环境日志工具
 */
const debugLog = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[EmojiPickerButton]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[EmojiPickerButton]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[EmojiPickerButton]', ...args);
    }
  },
};

/**
 * EmojiPickerButton 组件
 *
 * 整合了表情按钮和表情选择器的复合组件，点击按钮展开/收起表情选择器
 *
 * @example
 * ```tsx
 * // 基础用法
 * <EmojiPickerButton
 *   onEmojiSelect={(emoji) => setValue(value + emoji)}
 * />
 *
 * // 带分类的用法
 * <EmojiPickerButton
 *   onEmojiSelect={(emoji) => setValue(value + emoji)}
 *   showCategories
 *   defaultCategory="emotion"
 * />
 *
 * // 自定义样式和回调
 * <EmojiPickerButton
 *   onEmojiSelect={handleEmojiSelect}
 *   onButtonClick={handleButtonClick}
 *   disabled={false}
 *   buttonClassName="custom-class"
 * />
 * ```
 */
export const EmojiPickerButton = memo<EmojiPickerButtonProps>(
  ({
    onEmojiSelect,
    disabled = false,
    onButtonClick,
    emojis,
    showCategories = false,
    defaultCategory = 'emotion',
    gridColumns = 8,
    buttonClassName,
    containerClassName,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 使用 ref 存储回调，避免事件监听器重新绑定
    const callbacksRef = useRef({
      onEmojiSelect,
      onButtonClick,
    });

    useEffect(() => {
      callbacksRef.current = { onEmojiSelect, onButtonClick };
    });

    // 禁用时自动关闭表情选择器
    useEffect(() => {
      if (disabled && isOpen) {
        debugLog.warn('Emoji picker closed due to disabled state');
        setIsOpen(false);
      }
    }, [disabled, isOpen]);

    // 处理外部点击和 ESC 键关闭
    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleClickOutside = (event: globalThis.MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          debugLog.log('Emoji picker closed due to outside click');
          setIsOpen(false);
        }
      };

      const handleEscape = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          debugLog.log('Emoji picker closed due to ESC key');
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

    // 处理按钮点击
    const handleButtonClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          debugLog.warn('Emoji picker button click ignored: disabled');
          return;
        }

        event.stopPropagation();
        callbacksRef.current.onButtonClick?.();
        setIsOpen((prev) => {
          const newState = !prev;
          debugLog.log('Emoji picker toggled:', newState);
          return newState;
        });
      },
      [disabled],
    );

    // 处理表情选择
    const handleEmojiSelect = useCallback((emoji: string) => {
      try {
        callbacksRef.current.onEmojiSelect(emoji);
        debugLog.log('Emoji selected:', emoji);
        setIsOpen(false);
      } catch (error) {
        debugLog.error('Failed to select emoji:', error);
      }
    }, []);

    // 处理选择器关闭
    const handleClose = useCallback(() => {
      debugLog.log('Emoji picker closed');
      setIsOpen(false);
    }, []);

    return (
      <div
        ref={containerRef}
        className={cn('relative inline-flex shrink-0', containerClassName)}
        data-testid={TEST_IDS.COMPOSER_EMOJI}
      >
        {/* 表情按钮 */}
        <Button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full',
            'text-gray-400 dark:text-gray-500 transition-all duration-200',
            'hover:text-text hover:scale-110',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
            // 激活状态
            isOpen && 'text-text rotate-12',
            buttonClassName,
          )}
          onClick={handleButtonClick}
          aria-label={ARIA_LABELS.EMOJI}
          aria-pressed={isOpen}
          aria-haspopup="dialog"
        >
          <Smile className={BUTTON_SIZES.ICON_MEDIUM} />
        </Button>

        {/* 表情选择器 */}
        <EmojiPicker
          open={isOpen}
          onClose={handleClose}
          onEmojiSelect={handleEmojiSelect}
          emojis={emojis}
          showCategories={showCategories}
          defaultCategory={defaultCategory}
          gridColumns={gridColumns}
        />
      </div>
    );
  },
);

EmojiPickerButton.displayName = 'EmojiPickerButton';
