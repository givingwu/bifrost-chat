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
export interface IStringMessage {
  text: string;
}

/** 多媒体消息 */
export interface IMediaMessage {
  /** 多媒体资源 URL */
  url: string;
  /** 多媒体类型 */
  mimeType: string;
  /** 资源大小 */
  size?: number;
}

/** 模板消息 */
export interface ITemplateMessage<Extension = Record<string, unknown>>
  extends Omit<IStringMessage, 'type'> {
  /** 模版 ID */
  templateId: string | number;
  /** 模版参数 */
  params: Record<string, string>;
  /** 扩展字段 */
  ext?: Extension;
}

/** 位置消息 */
export interface ILocationMessage {
  /** 地址文本 */
  address: string;
}

/** 富媒体消息 */
export interface IRichMediaMessage {
  /** 描述文本 */
  desc: string;
}

/** 鉴权消息 */
export interface IAuthMessage {
  /** 用户 Token */
  token: string;
  /** 过期时间（可选） */
  expiresIn?: number;
}

/**
 * 标准化消息内容结构（Anti-Corruption Layer）
 */
export type MessageContent =
  | IStringMessage
  | IMediaMessage
  | ITemplateMessage
  | ILocationMessage
  | IRichMediaMessage
  | IAuthMessage;

/**
 * 客户端类型
 */
export enum ClientTypeEnum {
  /** - ios("ios", "ios"), */
  IOS = 'ios',
  /** - android("android", "Android"), */
  Android = 'android',
  /** - web("web", "web"), */
  Web = 'web',
}

/**
 * 标准化的消息参与者，避免直接暴露协议 from/to
 */
export interface MessageParticipant {
  /** 协议中的 app 字段（租户） */
  app: string;
  /** 协议中的 pin 字段（用户/UID/电话/邮箱） */
  pin: string;
  /** 客户端类型 */
  clientType?: ClientTypeEnum;
  /** 渠道类型（支持枚举和字符串） */
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
  /** 会话 ID */
  conversationId: string;
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
  sender: MessageParticipant;
  /** 标准化接收者 */
  receiver: MessageParticipant;
  /** 透传协议字段（from/to/ptype 等） */
  metadata?: Record<string, unknown>;
  /** 消息来源（内部使用，用于区分服务端消息和本地失败消息） */
  _source?: 'server' | 'local';
  /** 离线消息 ID（用于重试/删除本地失败消息） */
  _offlineMessageId?: string;
  /** 错误信息（发送失败时） */
  error?: string | Error;
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
 * 消息发送失败类型
 */
export enum MessageFailureTypeEnum {
  /** 网络错误（可重试） */
  Network = 'network',
  /** 业务逻辑错误（不可重试） */
  BusinessLogic = 'business_logic',
  /** 验证错误（不可重试） */
  Validation = 'validation',
  /** 权限错误（不可重试） */
  Authorization = 'authorization',
  /** 配额错误（不可重试） */
  Quota = 'quota',
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
  /** 错误类型（用于区分可重试和不可重试） */
  errorType?: MessageFailureTypeEnum;
  /** 重试次数 */
  retryCount?: number;
  /** 是否可重试 */
  retryable?: boolean;
  /** 是否需要回滚消息 */
  needRollback?: boolean;
}
