import type { AgentStatusEnum } from './agent.interface';
import type { ChannelTypeEnum } from './channel.interface';

/**
 * 会话状态枚举
 */
export enum ConversationStatusEnum {
  /** 活跃 */
  Active = 'active',
  /** 等待中 */
  Waiting = 'waiting',
  /** 已关闭 */
  Closed = 'closed',
  /** 已归档 */
  Archived = 'archived',
}

/** 用户接口 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户显示名称 */
  name: string;
  /** 用户头像 URL */
  avatarUrl?: string;
  /** 用户状态 */
  status: AgentStatusEnum;
  /** 用户邮箱 */
  email?: string;
  /** 用户电话 */
  phone?: string;
  /** 用户角色 */
  role?: string;
  /** 用户标签 */
  tags?: string[];
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
  channel: ChannelTypeEnum;
  /** 会话是否激活 */
  isActive?: boolean;
  /** 会话状态 */
  status?: ConversationStatusEnum;
  /** 会话优先级 */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** 会话创建时间 */
  createdAt?: string;
  /** 会话更新时间 */
  updatedAt?: string;
  /** 会话标签 */
  tags?: string[];
  /** 会话元数据 */
  metadata?: Record<string, unknown>;
  /** 当前会话支持的渠道列表（可选） */
  supportedChannels?: ChannelTypeEnum[];
}

/**
 * 会话筛选条件
 */
export interface ConversationFilter {
  /** 渠道类型筛选 */
  channelTypes?: ChannelTypeEnum[];
  /** 状态筛选 */
  statuses?: ConversationStatusEnum[];
  /** 搜索关键词 */
  keyword?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 是否只显示未读 */
  unreadOnly?: boolean;
}

/**
 * 会话排序选项
 */
export enum ConversationSortEnum {
  /** 按最后消息时间降序 */
  LastMessageTimeDesc = 'last_message_time_desc',
  /** 按最后消息时间升序 */
  LastMessageTimeAsc = 'last_message_time_asc',
  /** 按未读数量降序 */
  UnreadCountDesc = 'unread_count_desc',
  /** 按创建时间降序 */
  CreatedAtDesc = 'created_at_desc',
}
