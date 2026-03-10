import type { ChannelTypeEnum } from './channel.interface';
import type { ConnectionStateEnum } from './connection.interface';
import type { User } from './conversation.interface';
import type { SDKError } from './error.interface';
import type { StandardMessage } from './message.interface';
import type { MessageTypeConfig } from './message-type-config.interface';
import type { ThemeModeEnum } from './theme.interface';
import type { LanguageCodeEnum } from './language.interface';

/**
 * SDK 配置接口
 */
export interface SDKConfig {
  /** API 端点 */
  endpoint: string;
  /** 调试模式 */
  debug?: boolean;
  /** 是否启用持久化 */
  enablePersistence?: boolean;
  /** 持久化键名前缀 */
  persistenceKey?: string;
  /** 消息重试配置 */
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
  /** 主题配置 */
  theme?: {
    defaultMode?: ThemeModeEnum;
    primaryColor?: string;
  };
  /** 语言配置 */
  language?: {
    defaultCode?: LanguageCodeEnum;
  };
  /** 是否启用 DevTools */
  enableDevTools?: boolean;
  /** 消息类型配置 */
  messageTypeConfig?: MessageTypeConfig;
}

/**
 * SDK 上下文，控制当前对话与策略。
 */
export interface SDKContext {
  /** 宿主侧用户信息 */
  hostUser: User;
  /** 用户鉴权 Token */
  customerToken: string;
  /** 对话 ID（Conversation 级） */
  conversationId: string;
  /** 对话超时时间（毫秒） */
  conversationTimeout?: number;
  /** 初始策略（允许的渠道） */
  initialStrategy?: { allowedChannels: ChannelTypeEnum[] };
}

/**
 * SDK 事件类型
 */
export enum SDKEventTypeEnum {
  /** 消息接收 */
  MessageReceived = 'message_received',
  /** 来电 */
  IncomingCall = 'incoming_call',
  /** 连接状态变化 */
  ConnectionChanged = 'connection_changed',
  /** 错误发生 */
  Error = 'error',
  /** 对话关闭 */
  ConversationClosed = 'conversation_closed',
}

/**
 * SDK 动作类型
 */
export enum SDKActionTypeEnum {
  /** 发起呼叫 */
  MakeCall = 'make_call',
  /** 发送消息 */
  SendMessage = 'send_message',
  /** 切换渠道 */
  SwitchChannel = 'switch_channel',
}

/**
 * SDK 事件处理器类型映射
 */
export interface SDKEventHandlers {
  [SDKEventTypeEnum.MessageReceived]: (msg: StandardMessage) => void;
  [SDKEventTypeEnum.IncomingCall]: (data: IncomingCallData) => void;
  [SDKEventTypeEnum.ConnectionChanged]: (data: ConnectionChangeData) => void;
  [SDKEventTypeEnum.Error]: (error: SDKError) => void;
  [SDKEventTypeEnum.ConversationClosed]: () => void;
}

/**
 * 来电数据
 */
export interface IncomingCallData {
  /** 呼叫者 ID */
  callerId: string;
  /** 呼叫者名称 */
  callerName?: string;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
}

/**
 * 连接变化数据
 */
export interface ConnectionChangeData {
  /** 连接状态 */
  status: ConnectionStateEnum;
  /** 错误信息（如果断开） */
  error?: string;
}

/**
 * SDK 动作参数类型映射
 */
export interface SDKActionParams {
  [SDKActionTypeEnum.MakeCall]: { phone: string };
  [SDKActionTypeEnum.SendMessage]: {
    content: string;
    channelType?: ChannelTypeEnum;
  };
  [SDKActionTypeEnum.SwitchChannel]: { channelType: ChannelTypeEnum };
}

/**
 * SDK 状态
 */
export interface SDKStatus {
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 是否已连接 */
  isConnected: boolean;
  /** 当前对话 ID */
  conversationId?: string;
  /** 当前渠道 */
  activeChannel?: ChannelTypeEnum;
}
