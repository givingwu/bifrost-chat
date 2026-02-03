import { type KeyboardEvent, type MouseEvent, memo } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { cn } from '@/utils/class.util';
import { Avatar } from '../Avatar';
import { ChannelBadge } from '../toolbar/ChannelBadge';

export interface ConversationAvatarProps {
  /** 头像 URL */
  url?: string | null;
  /** 用户名称 */
  name?: string | null;
  /** 渠道类型 */
  channel?: Conversation['channel'];
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
  /** 点击回调 */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** 键盘事件回调 */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * ConversationAvatar：会话头像组件。
 * - 显示用户头像和渠道徽章。
 * - 基于通用 Avatar 组件构建。
 * - 支持自定义尺寸和样式。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const ConversationAvatar = memo(
  ({
    url,
    name = 'Unknown',
    channel,
    size = 'md',
    className = '',
    onClick,
    onKeyDown,
  }: ConversationAvatarProps) => {
    return (
      <div className={cn('relative inline-block', className)}>
        <Avatar
          src={url}
          alt={name || '用户头像'}
          size={size}
          onClick={onClick}
          onKeyDown={onKeyDown}
          className="shadow-sm"
        />

        {channel && (
          <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white dark:border-gray-900">
            <ChannelBadge type={channel} />
          </div>
        )}
      </div>
    );
  },
);

ConversationAvatar.displayName = 'ConversationAvatar';
