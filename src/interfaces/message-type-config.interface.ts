import type { ChannelTypeEnum } from './channel.interface';
import type { MessageTypeEnum } from './message.interface';

/**
 * 消息类型显示策略
 */
export enum MessageTypeDisplayStrategy {
  /** 显示为"不支持的消息类型"提示 */
  ShowUnsupported = 'show_unsupported',
  /** 完全隐藏（不在消息列表中显示） */
  Hide = 'hide',
  /** 降级显示（如富媒体消息显示为文本链接） */
  Fallback = 'fallback',
}

/**
 * 单个渠道的消息类型配置
 */
export interface ChannelMessageTypeConfig {
  /** 允许的消息类型列表 */
  allowedTypes: MessageTypeEnum[];
  /** 不支持消息的显示策略（可选，默认 show_unsupported） */
  displayStrategy?: MessageTypeDisplayStrategy;
  /** 自定义不支持提示文案（可选） */
  unsupportedMessage?: string;
}

/**
 * 消息类型配置
 */
export interface MessageTypeConfig {
  /** 全局默认允许的消息类型列表 */
  defaultAllowedTypes?: MessageTypeEnum[];
  /** 全局默认显示策略 */
  defaultDisplayStrategy?: MessageTypeDisplayStrategy;
  /** 按渠道配置的消息类型支持 */
  channelConfigs?: Partial<Record<ChannelTypeEnum, ChannelMessageTypeConfig>>;
}
