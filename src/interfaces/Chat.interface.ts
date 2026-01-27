/**
 * SDK 允许的渠道类型。
 * - 对应 docs 中 AdapterFactory 的选择依据。
 */
export type ChannelType = 'sms' | 'whatsapp' | 'email' | 'voip' | 'waba';

/**
 * 消息状态枚举，对应 ACK 协议中的 msg_receive_ack/msg_read_ack。
 */
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * 消息内容类型，对应 specs/聊天消息协议.md。
 */
export type MessageContentType =
  | 'text'
  | 'voice'
  | 'video'
  | 'image'
  | 'file'
  | 'template'
  | 'call_log';

/**
 * 标准化消息内容结构（Anti-Corruption Layer）。
 */
export type MessageContent =
  | { text: string }
  | { url: string; mimeType: string; size?: number }
  | { templateId: string | number; params: Record<string, string> };

/**
 * 标准化的消息参与者，避免直接暴露协议 from/to。
 */
export interface MessageParticipant {
  /** 用户或坐席 ID */
  id: string;
  /** 协议中的 app 字段（租户/角色） */
  app?: string;
  /** 客户端类型（pc/mobile 等） */
  clientType?: string;
}

/**
 * SDK 内部标准消息体：与 Packet/ACK 等协议解耦。
 */
export interface StandardMessage {
  /** 真实消息 ID（mid），ACK 回写后绑定 */
  id: string;
  /** 临时消息 ID（客户端生成） */
  tempId?: string;
  /** 消息方向 */
  direction: 'inbound' | 'outbound';
  /** 渠道类型 */
  channelType: ChannelType;
  /** 消息状态 */
  status: MessageStatus;
  /** 服务端时间戳 */
  timestamp: number;
  /** 消息类型 */
  type: MessageContentType;
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
 * SDK 上下文，控制当前会话与策略。
 */
export interface SDKContext {
  /** 会话 ID（Session 级） */
  sessionId: string;
  /** 用户鉴权 Token */
  customerToken: string;
  /** 宿主侧用户信息 */
  hostUser: { id: string; name: string };
  /** 初始策略（允许的渠道） */
  initialStrategy?: { allowedChannels: ChannelType[] };
}

/**
 * SDK 对 Host 暴露的事件类型。
 */
export type SDKEvent = 'message_received' | 'incoming_call';

/**
 * SDK 对 Host 暴露的动作类型。
 */
export type SDKAction = 'make_call';

/**
 * SDK 对宿主系统的统一入口（Facade）。
 */
export interface IChatSDK {
  init(config: { endpoint: string; debug?: boolean }): Promise<boolean>;
  destroy(): void;
  openContext(context: SDKContext): Promise<void>;
  closeContext(): void;
  on(event: 'message_received', callback: (msg: StandardMessage) => void): void;
  on(event: 'incoming_call', callback: (data: unknown) => void): void;
  emit(action: 'make_call', params: { phone: string }): void;
}
