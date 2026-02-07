import type { ChannelTypeEnum } from './channel.interface';

/**
 * 消息上行/下行方向
 */
export enum MessageDirectionEnum {
  /** 上行消息（用户/客户发出） */
  Incoming = 'incoming',
  /** 下行消息（坐席/系统发出） */
  Outgoing = 'outgoing',
}

/**
 * 消息状态枚举，对应 ACK 协议中的 msg_receive_ack/msg_read_ack
 */
export enum MessageStatusEnum {
  /** 消息创建（客户端生成临时消息） */
  Created = 'created',
  /** 消息发送中 */
  Sending = 'sending',
  /** 消息已发送（服务端已接收） */
  Sent = 'sent',
  /** 消息已送达（对方设备已接收） */
  Delivered = 'delivered',
  /** 消息已读（对方已查看） */
  Read = 'read',
  /** 消息发送失败 */
  Failed = 'failed',
  /** 消息在离线队列中等待发送 */
  Queued = 'queued',
}

/**
 * 消息内容类型，对应 specs/聊天消息协议.md
 */
export enum MessageTypeEnum {
  /** 文本消息 */
  Text = 'text',
  /** 图片消息 */
  Image = 'image',
  /** 语音消息 */
  Audio = 'audio',
  /** 视频消息 */
  Video = 'video',
  /** 文件消息 */
  File = 'file',
  /** 模板消息 */
  Template = 'template',
  /** 位置消息 */
  Location = 'location',
  /** 富媒体消息 */
  RichMedia = 'rich_media',
  /** 其他类型消息 */
  Other = 'other',
}

/** 字符串消息 */
export interface StringMessage {
  text: string;
}

/** 多媒体消息 */
export interface MediaMessage {
  url: string;
  mimeType: string;
  size?: number;
}

/** 模板消息 */
export interface TemplateMessage extends StringMessage {
  templateId: string | number;
  params: Record<string, string>;
}

/**
 * 标准化消息内容结构（Anti-Corruption Layer）
 */
export type MessageContent = StringMessage | MediaMessage | TemplateMessage;

/**
 * 标准化的消息参与者，避免直接暴露协议 from/to
 */
export interface MessageParticipant {
  /** 用户或坐席 ID */
  id: string;
  /** 协议中的 app 字段（租户/角色） */
  app?: string;
  /** 客户端类型（pc/mobile 等） */
  clientType?: string;
  /** 渠道类型 */
  channelType?: ChannelTypeEnum;
}

/**
 * SDK 内部标准消息体：与 Packet/ACK 等协议解耦
 */
export interface StandardMessage {
  /** 真实消息 ID（mid），ACK 回写后绑定 */
  id: string;
  /** 临时消息 ID（客户端生成） */
  tempId?: string;
  /** 消息方向 */
  direction: MessageDirectionEnum;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
  /** 消息状态 */
  status: MessageStatusEnum;
  /** 服务端时间戳 */
  timestamp: number;
  /** 消息类型 */
  type: MessageTypeEnum;
  /** 消息内容 */
  content: MessageContent;
  /** 标准化发送者 */
  sender?: MessageParticipant;
  /** 标准化接收者 */
  receiver?: MessageParticipant;
  /** 透传协议字段（from/to/ptype 等） */
  metadata?: Record<string, unknown>;
}

/**
 * 发送消息的选项
 */
export interface SendMessageOptions {
  /** 消息类型，默认 Text */
  type?: MessageTypeEnum;
  /** 自定义 sender，默认从当前会话推断 */
  sender?: MessageParticipant;
  /** 自定义 receiver，默认从当前会话推断 */
  receiver?: MessageParticipant;
  /** 自定义 channel，默认从当前策略获取 */
  channelType?: ChannelTypeEnum;
  /** 消息优先级 */
  priority?: MessagePriorityEnum;
  /** 是否需要回执 */
  requireReceipt?: boolean;
  /** 过期时间（毫秒） */
  expireAt?: number;
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 消息优先级枚举
 */
export enum MessagePriorityEnum {
  /** 低优先级 */
  Low = 'low',
  /** 普通优先级 */
  Normal = 'normal',
  /** 高优先级 */
  High = 'high',
  /** 紧急优先级 */
  Urgent = 'urgent',
}

/**
 * 消息重试配置
 */
export interface MessageRetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 指数退避因子 */
  backoffFactor?: number;
  /** 最大重试延迟（毫秒） */
  maxRetryDelay?: number;
}

/**
 * 消息发送结果
 */
export interface MessageSendResult {
  /** 临时消息 ID */
  tempId: string;
  /** 真实消息 ID（服务端返回） */
  messageId?: string;
  /** 发送状态 */
  status: MessageStatusEnum;
  /** 错误信息（如果失败） */
  error?: string;
  /** 重试次数 */
  retryCount?: number;
}
