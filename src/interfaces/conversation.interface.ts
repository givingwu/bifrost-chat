import type { ChannelType } from './channel.interface';

/** 用户接口 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户显示名称 */
  name: string;
  /** 用户头像 URL */
  avatarUrl: string;
  /** 用户状态 */
  status: 'online' | 'offline' | 'busy';
}

/** 会话接口 */
export interface Conversation {
  /** 会话唯一标识 */
  id: string;
  /** 会话标题 */
  user: User;
  /** 会话最后一条消息内容 */
  lastMessage: string;
  /** 会话最后一条消息时间 */
  lastMessageTime: string;
  /** 会话未读消息数 */
  unreadCount: number;
  /** 会话所属频道 */
  channel: ChannelType;
  /** 会话是否激活 */
  isActive?: boolean;
}
