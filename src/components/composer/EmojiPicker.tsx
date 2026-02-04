import { type MouseEvent, memo } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS } from './composer.constants';

/**
 * 常用表情列表
 */
export const COMMON_EMOJIS = [
  // 表情与情感
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '🤯',

  // 手势
  '👍',
  '👎',
  '👌',
  '✌️',
  '🤞',
  '🤝',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '👇',
  '☝️',
  '✋',
  '🤚',

  // 心形
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',

  // 符号
  '✅',
  '❌',
  '⭕',
  '❓',
  '❗',
  '⭐',
  '🌟',
  '✨',
  '💫',
  '🔥',
  '💯',
  '✈️',
  '🚀',
  '🛫',
  '🛬',
  '💼',
  '📅',
  '📆',
  '📇',
  '📈',

  // 动物
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',

  // 食物
  '🍎',
  '🍊',
  '🍋',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🫐',
  '🍈',
  '🍒',
  '🍑',
  '🥭',
  '🍍',
  '🥥',
  '🥝',
  '🍅',
  '🍆',
  '🥑',
  '🥦',
  '🥬',
] as const;

export interface EmojiPickerProps {
  /** 选择表情的回调 */
  onEmojiSelect: (emoji: string) => void;
  /** 是否显示 */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义表情列表 */
  emojis?: readonly string[];
}

/**
 * EmojiPicker 组件
 *
 * 表情选择器，支持点击选择表情
 *
 * @example
 * ```tsx
 * <EmojiPicker
 *   open={isOpen}
 *   onEmojiSelect={(emoji) => setValue(value + emoji)}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const EmojiPicker = memo<EmojiPickerProps>(
  ({ onEmojiSelect, open = false, onClose, emojis = COMMON_EMOJIS }) => {
    const handleEmojiClick = (
      event: MouseEvent<HTMLButtonElement>,
      emoji: string,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      onEmojiSelect(emoji);
      onClose?.();
    };

    if (!open) {
      return null;
    }

    return (
      <div
        className={cn(
          'absolute bottom-full right-0 mb-2',
          'z-50',
          'w-80 max-h-96 overflow-y-auto',
          'rounded-xl border border-border bg-card shadow-lg',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
        )}
        data-testid={TEST_IDS.COMPOSER_EMOJI}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h3 className="text-sm font-semibold text-text">选择表情</h3>
        </div>

        {/* 表情网格 */}
        <div className="grid grid-cols-8 gap-1 p-2">
          {Array.from(emojis).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => handleEmojiClick(e, emoji)}
              className={cn(
                'flex aspect-square items-center justify-center',
                'text-2xl',
                'rounded-lg',
                'transition-all duration-150',
                'hover:bg-muted',
                'focus:outline-none focus:ring-2 focus:ring-primary/40',
                'active:scale-90',
              )}
              aria-label={`Insert ${emoji}`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-[10px] text-text-muted">
            点击表情即可插入到输入框
          </p>
        </div>
      </div>
    );
  },
);

EmojiPicker.displayName = 'EmojiPicker';
