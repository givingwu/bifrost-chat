import type { ChannelTypeEnum } from './channel.interface';
import type { StandardMessage } from './message.interface';

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
  initialStrategy?: { allowedChannels: ChannelTypeEnum[] };
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
  /** 初始化 SDK 实例 */
  init(config: { endpoint: string; debug?: boolean }): Promise<boolean>;
  /** 销毁 SDK 实例 */
  destroy(): void;
  /** 打开会话上下文 */
  openContext(context: SDKContext): Promise<void>;
  /** 关闭会话上下文 */
  closeContext(): void;
  /** 监听 SDK 事件 */
  on(event: 'message_received', callback: (msg: StandardMessage) => void): void;
  /** 触发 SDK 动作 */
  on(event: 'incoming_call', callback: (data: unknown) => void): void;
  /** 触发 SDK 动作 */
  emit(action: 'make_call', params: { phone: string }): void;
}
