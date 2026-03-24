import { Pin } from 'lucide-react';
import { type KeyboardEvent, memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/Button';
import { useConversationUnread } from '@/hooks';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useLanguage } from '@/store';
import { cn } from '@/utils/class.util';
import { formatRelativeTime } from '@/utils/time.util';
import { ConversationAvatar } from './ConversationAvatar';

export interface ConversationItemProps {
  /** 会话对象 */
  conversation: Conversation;
  /** 选择会话回调函数 */
  onSelect?: (conversationId: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否为置顶会话 */
  isPinned?: boolean;
  /**
   * 自定义渲染元数据区域（在人名和最后消息之间）
   * @param conversation 会话数据
   * @returns ReactNode 或 null
   * @example
   * ```tsx
   * renderMeta={(conv) => (
   *   <div className="text-xs text-gray-500">
   *     <span>({conv.metadata?.relationship})</span>
   *     <span className="ml-2">{conv.metadata?.assetItemNumber}</span>
   *   </div>
   * )}
   * ```
   */
  /**
   * 自定义标题 formatter
   *
   * 优先于 `conversation.user.name`，用于格式化第一行展示文案（如「姓名（关系）」）。
   * 未传时回退到 `conversation.user.name`。
   *
   * @example
   * ```tsx
   * getConversationDisplayTitle={(conv) =>
   *   conv.metadata?.relationship
   *     ? `${conv.user.name}（${conv.metadata.relationship}）`
   *     : conv.user.name
   * }
   * ```
   */
  getConversationDisplayTitle?: (conversation: Conversation) => string;
  /**
   * 自定义渲染元数据区域（在标题和最后消息之间）
   */
  renderMeta?: (conversation: Conversation) => React.ReactNode;
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
 * - 支持通过 renderMeta 自定义渲染元数据区域。
 * - 支持选中状态和未读消息提示。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持键盘导航（Enter 和 Space 键）。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationItem = memo(
  ({
    conversation,
    onSelect,
    className = '',
    isPinned = false,
    renderMeta,
    getConversationDisplayTitle,
  }: ConversationItemProps) => {
    const { t } = useTranslation();
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

    // 置顶图标的样式（只在非激活状态显示）
    const pinIconClassName = cn(
      'absolute top-1 right-1 transform rotate-45',
      'h-2.5 w-2.5', // 更小的图标尺寸
      'text-blue-500 dark:text-blue-400',
      'opacity-80 group-hover:opacity-100',
      'transition-opacity duration-200',
    );

    // 上次回复时间（相对时间）
    const { code: languageCode } = useLanguage();
    const lastReplyTime = useMemo(
      () => formatRelativeTime(conversation.lastMessageTime, t, languageCode),
      [conversation.lastMessageTime, languageCode, t],
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

    // 渲染元数据区域
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const metaContent = useMemo(() => {
      return renderMeta?.(conversation);
    }, [renderMeta]);

    const effectiveUnreadCount = useConversationUnread(
      conversation.id,
      conversation.unreadCount,
    );

    return (
      <Button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={containerClassName}
        aria-pressed={conversation.isActive}
        aria-label={t('conversation.ariaLabel', {
          name: conversation.user.name,
          count: effectiveUnreadCount,
        })}
      >
        {/* 置顶图标 - 绝对定位在右上角，只在非激活状态显示 */}
        {isPinned && !conversation.isActive && (
          <Pin className={pinIconClassName} aria-hidden="true" />
        )}
        <div className="flex w-full items-start gap-3">
          {/* 头像区域：未读 Badge 悬浮在右上角（微信风格） */}
          <div className="relative shrink-0">
            <ConversationAvatar
              src={conversation.user.avatarUrl}
              name={conversation.user.name}
            />
            {effectiveUnreadCount > 0 && !conversation.isActive && (
              <span className="absolute -right-1 -top-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* 第一行：人名 + 时间 */}
            <div className="flex items-baseline justify-around gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <h4
                  className={cn('truncate text-sm font-semibold', styles.title)}
                >
                  {getConversationDisplayTitle
                    ? getConversationDisplayTitle(conversation)
                    : conversation.user.name}
                </h4>
              </div>
              <span className={cn('text-xs shrink-0', styles.time)}>
                {lastReplyTime}
              </span>
            </div>
            {/* 第二行：自定义元数据区域（由业务层渲染） */}
            {metaContent}
            {/* 第三行：最后一条消息 */}
            <p
              className={cn(
                'line-clamp-1 text-sm truncate leading-snug',
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
