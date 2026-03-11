import { type KeyboardEvent, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/Button';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useLanguage } from '@/store';
import { cn } from '@/utils/class.util';
import { formatTimestamp } from '@/utils/time.util';
import { ConversationAvatar } from './ConversationAvatar';

export interface ConversationItemProps {
  /** 会话对象 */
  conversation: Conversation;
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 会话状态样式配置
 */
const ACTIVE_STATE_STYLES = {
  container: 'bg-blue-500 shadow-md shadow-blue-500/20',
  title: 'text-primary-foreground',
  time: 'text-primary-foreground/70',
  message: 'text-primary-foreground/80',
} as const;

const INACTIVE_STATE_STYLES = {
  container: 'hover:bg-gray-200/50 dark:hover:bg-white/5 bg-transparent',
  title: 'text-gray-600 dark:text-white',
  time: ' text-gray-500 dark:text-gray-400',
  message: ' text-gray-500 dark:text-gray-400',
} as const;

/**
 * ConversationItem：会话列表项组件。
 * - 显示会话信息（头像、名称、最后消息、时间、未读数）。
 * - 支持选中状态和未读消息提示。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持键盘导航（Enter 和 Space 键）。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationItem = memo(
  ({ conversation, onSelect, className = '' }: ConversationItemProps) => {
    // 确定使用的样式
    const styles = conversation.isActive
      ? ACTIVE_STATE_STYLES
      : INACTIVE_STATE_STYLES;

    // 容器类名
    const containerClassName = cn(
      'w-full flex items-start p-3 rounded-xl transition-all duration-200 text-left group relative',
      styles.container,
      className,
    );

    // 上次回复时间
    const { code: languageCode } = useLanguage();
    const lastReplyTime = useMemo(
      () =>
        formatTimestamp(
          new Date(conversation.lastMessageTime).getTime(),
          languageCode,
        ),
      [conversation.lastMessageTime, languageCode],
    );

    // 处理键盘事件
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(conversation.id);
        }
      },
      [conversation.id, onSelect],
    );

    // 处理点击事件
    const handleClick = useCallback(() => {
      onSelect?.(conversation.id);
    }, [conversation.id, onSelect]);

    return (
      <Button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={containerClassName}
        aria-pressed={conversation.isActive}
        aria-label={`与 ${conversation.user.name} 的会话${
          conversation.unreadCount > 0
            ? `，有 ${conversation.unreadCount} 条未读消息`
            : ''
        }`}
      >
        <div className="flex w-full items-start gap-3">
          {/* 头像区域：未读 Badge 悬浮在右上角（微信风格） */}
          <div className="relative flex-shrink-0">
            <ConversationAvatar
              src={conversation.user.avatarUrl}
              name={conversation.user.name}
            />
            {conversation.unreadCount > 0 && !conversation.isActive && (
              <span className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {conversation.unreadCount > 99
                  ? '99+'
                  : conversation.unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-around gap-2">
              <h4
                className={cn(
                  'truncate text-sm font-semibold flex-1',
                  styles.title,
                )}
              >
                {conversation.user.name}
              </h4>
              <span className={cn('text-xs', styles.time)}>
                {lastReplyTime}
              </span>
            </div>
            <p
              className={cn(
                'line-clamp-2 text-sm truncate leading-snug',
                styles.message,
              )}
            >
              {conversation.lastMessage}
            </p>
          </div>
        </div>
      </Button>
    );
  },
);

ConversationItem.displayName = 'ConversationItem';
