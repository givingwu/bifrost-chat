import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS } from './composer.constants';

/**
 * 提及用户信息
 */
export interface MentionUser {
  /** 用户 ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 头像 URL（可选） */
  avatar?: string;
  /** 显示名称（可选，默认使用 name） */
  displayName?: string;
}

export interface MentionPickerProps {
  /** 可提及的用户列表 */
  users: MentionUser[];
  /** 选择用户的回调 */
  onMentionSelect: (user: MentionUser) => void;
  /** 是否显示 */
  open?: boolean;
  /** 当前搜索关键词 */
  query?: string;
  /** 关闭回调 */
  onClose?: () => void;
  /** 位置坐标 */
  position?: { x: number; y: number };
}

/**
 * MentionPicker 组件
 *
 * @提及功能，支持搜索和选择用户
 *
 * @example
 * ```tsx
 * <MentionPicker
 *   open={showMentionPicker}
 *   users={users}
 *   query={mentionQuery}
 *   onMentionSelect={(user) => insertMention(user)}
 *   onClose={() => setShowMentionPicker(false)}
 *   position={{ x: 100, y: 200 }}
 * />
 * ```
 */
export const MentionPicker = memo<MentionPickerProps>(
  ({ users, onMentionSelect, open = false, query = '', onClose, position }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // 过滤用户
    const filteredUsers = users.filter((user) => {
      const searchQuery = query.toLowerCase();
      const name = user.name.toLowerCase();
      const displayName = user.displayName?.toLowerCase() ?? '';
      return name.includes(searchQuery) || displayName.includes(searchQuery);
    });

    // 重置选中索引（当查询词或用户列表变化时）
    useEffect(() => {
      setSelectedIndex(0);
    }, []);

    // 键盘导航
    useEffect(() => {
      if (!open) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (filteredUsers.length === 0) {
          return;
        }

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredUsers.length - 1 ? prev + 1 : 0,
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredUsers.length - 1,
            );
            break;
          case 'Enter':
            event.preventDefault();
            if (filteredUsers[selectedIndex]) {
              onMentionSelect(filteredUsers[selectedIndex]);
            }
            break;
          case 'Escape':
            event.preventDefault();
            onClose?.();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, filteredUsers, selectedIndex, onMentionSelect, onClose]);

    // 点击外部关闭
    useEffect(() => {
      if (!open) {
        return;
      }

      const handleClickOutside = (event: Event) => {
        if (
          pickerRef.current &&
          !pickerRef.current.contains(event.target as Node)
        ) {
          onClose?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [open, onClose]);

    if (!open || filteredUsers.length === 0) {
      return null;
    }

    return (
      <div
        ref={pickerRef}
        className={cn(
          'absolute z-50',
          'w-64 max-h-64 overflow-y-auto',
          'rounded-xl border border-border bg-card shadow-lg',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        style={{
          left: position?.x ?? 0,
          top: position?.y ?? 0,
        }}
        data-testid={TEST_IDS.COMPOSER_HINT}
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-primary">@</span>
            <h3 className="text-sm font-semibold text-text">提及用户</h3>
          </div>
          {query && (
            <p className="mt-1 text-[10px] text-text-muted">搜索: {query}</p>
          )}
        </div>

        {/* 用户列表 */}
        <div className="py-1">
          {filteredUsers.map((user, index) => {
            const isSelected = index === selectedIndex;
            const displayName = user.displayName ?? user.name;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onMentionSelect(user)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2',
                  'transition-all duration-150',
                  'hover:bg-muted',
                  'focus:outline-none focus:bg-muted',
                  isSelected && 'bg-muted',
                )}
              >
                {/* 头像 */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center',
                    'rounded-full bg-primary/10 text-primary',
                    'text-xs font-semibold',
                  )}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* 用户信息 */}
                <div className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="truncate text-sm font-medium text-text">
                    {displayName}
                  </span>
                  {user.displayName && (
                    <span className="truncate text-[10px] text-text-muted">
                      @{user.name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-[10px] text-text-muted">
            使用 ↑↓ 选择，Enter 确认
          </p>
        </div>
      </div>
    );
  },
);

MentionPicker.displayName = 'MentionPicker';

/**
 * 检测输入中的 @提及触发
 */
export function detectMentionTrigger(
  value: string,
  cursorPosition: number,
): { trigger: boolean; query: string; start: number } {
  // 从光标位置向前查找最近的 @ 符号
  let atPosition = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = value[i];
    if (char === '@') {
      atPosition = i;
      break;
    }
    // 如果遇到空格，说明 @ 不连续
    if (char === ' ') {
      break;
    }
  }

  // 如果找到 @ 符号
  if (atPosition !== -1) {
    const query = value.slice(atPosition + 1, cursorPosition);
    // 检查 @ 前面是否是空格或行首
    const beforeAt = value[atPosition - 1];
    const isValidTrigger =
      atPosition === 0 || beforeAt === ' ' || beforeAt === '\n';

    if (isValidTrigger) {
      return {
        trigger: true,
        query,
        start: atPosition,
      };
    }
  }

  return {
    trigger: false,
    query: '',
    start: -1,
  };
}

/**
 * 插入提及到文本中
 */
export function insertMention(
  value: string,
  mention: { start: number; query: string; user: MentionUser },
): string {
  const before = value.slice(0, mention.start);
  const after = value.slice(mention.start + mention.query.length + 1);
  const mentionText = `@${mention.user.name}`;

  return `${before}${mentionText} ${after}`;
}
