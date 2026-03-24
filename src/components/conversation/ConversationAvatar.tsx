import { type KeyboardEvent, type MouseEvent, memo } from 'react';
import { cn } from '@/utils/class.util';
import { Avatar } from '../Avatar';

export interface ConversationAvatarProps {
  /** 头像 src */
  src?: string;
  /** 用户名称 */
  name: string;
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
    src,
    name,
    size = 'md',
    className = '',
    onClick,
    onKeyDown,
  }: ConversationAvatarProps) => {
    return (
      <div className={cn('relative inline-block align-middle', className)}>
        <Avatar
          src={src}
          alt={name || 'User Avatar'}
          size={size}
          onClick={onClick}
          onKeyDown={onKeyDown}
          className="shadow-sm"
        />
      </div>
    );
  },
);

ConversationAvatar.displayName = 'ConversationAvatar';
