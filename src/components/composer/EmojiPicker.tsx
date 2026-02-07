import {
  type KeyboardEvent,
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS } from './composer.constants';

/**
 * 表情分类类型
 */
export type EmojiCategory =
  | 'emotion'
  | 'gestures'
  | 'hearts'
  | 'symbols'
  | 'animals'
  | 'food';

/**
 * 表情分类信息
 */
interface EmojiCategoryInfo {
  /** 分类 ID */
  id: EmojiCategory;
  /** 分类名称 */
  name: string;
  /** 分类图标 */
  icon: string;
}

/**
 * 表情分类配置
 */
export const EMOJI_CATEGORIES: readonly EmojiCategoryInfo[] = [
  { id: 'emotion', name: '表情', icon: '😀' },
  { id: 'gestures', name: '手势', icon: '👍' },
  { id: 'hearts', name: '爱心', icon: '❤️' },
  { id: 'symbols', name: '符号', icon: '⭐' },
  { id: 'animals', name: '动物', icon: '🐶' },
  { id: 'food', name: '食物', icon: '🍎' },
] as const;

/**
 * 表情与情感
 */
const EMOTION_EMOJIS = [
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
] as const;

/**
 * 手势
 */
const GESTURE_EMOJIS = [
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
] as const;

/**
 * 心形
 */
const HEART_EMOJIS = [
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
] as const;

/**
 * 符号
 */
const SYMBOL_EMOJIS = [
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
] as const;

/**
 * 动物
 */
const ANIMAL_EMOJIS = [
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
] as const;

/**
 * 食物
 */
const FOOD_EMOJIS = [
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

/**
 * 表情分类映射
 */
const EMOJI_CATEGORY_MAP: Record<EmojiCategory, readonly string[]> = {
  emotion: EMOTION_EMOJIS,
  gestures: GESTURE_EMOJIS,
  hearts: HEART_EMOJIS,
  symbols: SYMBOL_EMOJIS,
  animals: ANIMAL_EMOJIS,
  food: FOOD_EMOJIS,
} as const;

/**
 * 常用表情列表（扁平化，用于向后兼容）
 */
export const COMMON_EMOJIS = [
  ...EMOTION_EMOJIS,
  ...GESTURE_EMOJIS,
  ...HEART_EMOJIS,
  ...SYMBOL_EMOJIS,
  ...ANIMAL_EMOJIS,
  ...FOOD_EMOJIS,
] as const;

export interface EmojiPickerProps {
  /** 选择表情的回调 */
  onEmojiSelect: (emoji: string) => void;
  /** 是否显示 */
  open?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义表情列表（向后兼容） */
  emojis?: readonly string[];
  /** 是否显示分类标签 */
  showCategories?: boolean;
  /** 默认选中的分类 */
  defaultCategory?: EmojiCategory;
  /** 每行显示的表情数量 */
  gridColumns?: number;
}

/**
 * 表情分类标签组件
 */
const EmojiCategoryTab = memo<{
  category: EmojiCategoryInfo;
  isActive: boolean;
  onClick: () => void;
}>(({ category, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-1 px-3 py-2',
      'rounded-lg transition-all duration-150',
      'hover:bg-muted',
      'focus:outline-none focus:ring-2 focus:ring-primary/40',
      isActive && 'bg-muted text-text',
      !isActive && 'text-text-muted',
    )}
    aria-label={`切换到${category.name}分类`}
    role="tab"
    aria-selected={isActive}
  >
    <span className="text-xl">{category.icon}</span>
    <span className="text-[10px]">{category.name}</span>
  </button>
));

EmojiCategoryTab.displayName = 'EmojiCategoryTab';

/**
 * EmojiPicker 组件
 *
 * 表情选择器，支持点击选择表情、分类切换、键盘导航
 *
 * @example
 * ```tsx
 * // 基础用法
 * <EmojiPicker
 *   open={isOpen}
 *   onEmojiSelect={(emoji) => setValue(value + emoji)}
 *   onClose={() => setIsOpen(false)}
 * />
 *
 * // 带分类的用法
 * <EmojiPicker
 *   open={isOpen}
 *   onEmojiSelect={(emoji) => setValue(value + emoji)}
 *   onClose={() => setIsOpen(false)}
 *   showCategories
 *   defaultCategory="emotion"
 * />
 * ```
 */
export const EmojiPicker = memo<EmojiPickerProps>(
  ({
    onEmojiSelect,
    open = false,
    onClose,
    emojis,
    showCategories = false,
    defaultCategory = 'emotion',
    gridColumns = 8,
  }) => {
    const [activeCategory, setActiveCategory] =
      useState<EmojiCategory>(defaultCategory);
    const [focusedEmoji, setFocusedEmoji] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resolvedGridColumns = useMemo(() => {
      const parsedColumns = Math.floor(gridColumns);

      if (!Number.isFinite(parsedColumns) || parsedColumns <= 0) {
        return 8;
      }

      return parsedColumns;
    }, [gridColumns]);

    // 重置焦点状态当打开/关闭时
    useEffect(() => {
      if (!open) {
        setFocusedEmoji(null);
      }
    }, [open]);

    // 使用 useMemo 缓存表情列表，避免每次渲染重新计算
    const emojiList = useMemo(() => {
      // 如果提供了自定义表情列表，使用自定义列表
      if (emojis) {
        return Array.from(emojis);
      }

      // 否则使用分类的表情列表
      if (showCategories) {
        return Array.from(EMOJI_CATEGORY_MAP[activeCategory]);
      }

      // 默认返回所有表情
      return Array.from(COMMON_EMOJIS);
    }, [emojis, showCategories, activeCategory]);

    // 处理表情点击
    const handleEmojiClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>, emoji: string) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          onEmojiSelect(emoji);
          onClose?.();
        } catch (error) {
          console.error('[EmojiPicker] Failed to select emoji:', error);
        }
      },
      [onEmojiSelect, onClose],
    );

    // 阻止鼠标按下导致输入框失焦，避免点击选择失效
    const handleEmojiMouseDown = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
      },
      [],
    );

    // 处理表情键盘事件
    const handleEmojiKeyDown = useCallback(
      (
        event: KeyboardEvent<HTMLButtonElement>,
        emoji: string,
        index: number,
      ) => {
        let nextIndex = index;

        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault();
            nextIndex = (index + 1) % emojiList.length;
            break;
          case 'ArrowLeft':
            event.preventDefault();
            nextIndex = (index - 1 + emojiList.length) % emojiList.length;
            break;
          case 'ArrowDown':
            event.preventDefault();
            nextIndex = (index + resolvedGridColumns) % emojiList.length;
            break;
          case 'ArrowUp':
            event.preventDefault();
            nextIndex =
              (index - resolvedGridColumns + emojiList.length) %
              emojiList.length;
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            onEmojiSelect(emoji);
            onClose?.();
            return;
          case 'Escape':
            event.preventDefault();
            onClose?.();
            return;
          default:
            return;
        }

        // 聚焦到下一个表情按钮
        const buttons =
          containerRef.current?.querySelectorAll('button[data-emoji]');
        const nextButton = buttons?.[nextIndex] as HTMLButtonElement;
        nextButton?.focus();
      },
      [emojiList.length, onEmojiSelect, onClose, resolvedGridColumns],
    );

    // 处理分类切换
    const handleCategoryChange = useCallback((category: EmojiCategory) => {
      setActiveCategory(category);
      setFocusedEmoji(null);
    }, []);

    // 处理容器键盘事件
    const handleContainerKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        // Tab 键不处理，让浏览器默认行为
        if (event.key === 'Tab') {
          return;
        }

        // ESC 键关闭选择器
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose?.();
          return;
        }

        // 其他键盘事件只在表情按钮上处理
        const target = event.target as HTMLElement;
        if (!target.dataset.emoji) {
          return;
        }
      },
      [onClose],
    );

    // 如果不显示，返回 null
    if (!open) {
      return null;
    }

    // 空列表处理
    if (emojiList.length === 0) {
      return (
        <div
          className={cn(
            'absolute bottom-full right-0 mb-2',
            'z-50',
            'w-80',
            'rounded-xl border border-border bg-card shadow-lg',
            'p-4',
            'animate-in fade-in slide-in-from-bottom-2 duration-200',
          )}
          data-testid={TEST_IDS.COMPOSER_EMOJI}
          role="dialog"
          aria-modal="true"
          aria-label="表情选择器"
        >
          <p className="text-sm text-text-muted text-center">暂无表情</p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          'absolute bottom-full right-0 mb-2',
          'z-50',
          'w-80 max-h-96 overflow-y-auto',
          'rounded-xl border border-border bg-card shadow-lg',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
        )}
        onKeyDown={handleContainerKeyDown}
        data-testid={TEST_IDS.COMPOSER_EMOJI}
        role="dialog"
        aria-modal="true"
        aria-label="表情选择器"
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <h3 className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-text">选择表情</span>
          </h3>
        </div>

        {/* 分类标签 */}
        {showCategories && !emojis && (
          <div
            className="flex gap-1 px-2 py-3 border-b border-border overflow-x-auto"
            role="tablist"
            aria-label="表情分类"
          >
            {EMOJI_CATEGORIES.map((category) => (
              <EmojiCategoryTab
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        )}

        {/* 表情网格 */}
        <div
          className="grid gap-1 p-2"
          style={{
            gridTemplateColumns: `repeat(${resolvedGridColumns}, minmax(0, 1fr))`,
          }}
          role="listbox"
          aria-label="表情列表"
        >
          {emojiList.map((emoji, index) => (
            <button
              key={emoji}
              type="button"
              data-emoji={emoji}
              onMouseDown={handleEmojiMouseDown}
              onClick={(e) => handleEmojiClick(e, emoji)}
              onKeyDown={(e) => handleEmojiKeyDown(e, emoji, index)}
              className={cn(
                'flex aspect-square items-center justify-center',
                'text-xl leading-none',
                'rounded-lg',
                'transition-all duration-150',
                'hover:bg-muted',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-muted',
                'active:scale-90',
                'cursor-pointer',
              )}
              aria-label={`插入表情 ${emoji}`}
              title={emoji}
              role="option"
              aria-selected={focusedEmoji === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-[10px] text-text-muted text-center">
            {showCategories && !emojis
              ? `当前分类：${EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.name} · 共 ${emojiList.length} 个表情`
              : `共 ${emojiList.length} 个表情`}
          </p>
        </div>
      </div>
    );
  },
);

EmojiPicker.displayName = 'EmojiPicker';
