import type { ChannelTypeEnum } from './channel.interface';
import type { ConnectionStateEnum } from './connection.interface';
import type { User } from './conversation.interface';
import type { SDKError } from './error.interface';
import type { StandardMessage } from './message.interface';

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
    defaultMode?: 'light' | 'dark' | 'system';
    primaryColor?: string;
  };
  /** 语言配置 */
  language?: {
    defaultCode?: 'en-US' | 'zh-CN';
  };
  /** 是否启用 DevTools */
  enableDevTools?: boolean;
}

/**
 * SDK 上下文，控制当前会话与策略。
 */
export interface SDKContext {
  /** 宿主侧用户信息 */
  hostUser: User;
  /** 用户鉴权 Token */
  customerToken: string;
  /** 会话 ID（Session 级） */
  sessionId: string;
  /** 会话超时时间（毫秒） */
  sessionTimeout?: number;
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
  /** 会话关闭 */
  SessionClosed = 'session_closed',
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
  [SDKEventTypeEnum.SessionClosed]: () => void;
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
 * SDK 对宿主系统的统一入口（Facade）。
 */
export interface ChatSDK {
  /** 初始化 SDK 实例 */
  init(config: SDKConfig): Promise<boolean>;
  /** 销毁 SDK 实例 */
  destroy(): void;
  /** 打开会话上下文 */
  openContext(context: SDKContext): Promise<void>;
  /** 关闭会话上下文 */
  closeContext(): void;
  /** 获取 SDK 版本 */
  getVersion(): string;
  /** 获取 SDK 状态 */
  getStatus(): SDKStatus;
  /** 监听 SDK 事件 */
  on<K extends keyof SDKEventHandlers>(
    event: K,
    callback: SDKEventHandlers[K],
  ): () => void;
  /** 触发 SDK 动作 */
  emit<K extends keyof SDKActionParams>(
    action: K,
    params: SDKActionParams[K],
  ): void;
}

/**
 * SDK 状态
 */
export interface SDKStatus {
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 是否已连接 */
  isConnected: boolean;
  /** 当前会话 ID */
  sessionId?: string;
  /** 当前渠道 */
  activeChannel?: ChannelTypeEnum;
}
