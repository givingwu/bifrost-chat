import { ChannelTypeEnum } from './channel.interface';
import { MessageTypeEnum } from './message.interface';

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

/**
 * 各渠道的默认消息类型支持列表
 */
export const DEFAULT_CHANNEL_MESSAGE_TYPES: Record<
  ChannelTypeEnum,
  MessageTypeEnum[]
> = {
  // SMS: 仅支持文本消息
  [ChannelTypeEnum.SMS]: [MessageTypeEnum.Text],

  // WhatsApp: 支持多种消息类型
  [ChannelTypeEnum.WhatsApp]: [
    MessageTypeEnum.Text,
    MessageTypeEnum.Image,
    MessageTypeEnum.Video,
    MessageTypeEnum.Audio,
    MessageTypeEnum.File,
    MessageTypeEnum.Location,
    MessageTypeEnum.Template,
  ],

  // Email: 支持文本和附件
  [ChannelTypeEnum.Email]: [
    MessageTypeEnum.Text,
    MessageTypeEnum.Image,
    MessageTypeEnum.File,
  ],

  // WABA: 支持所有类型
  [ChannelTypeEnum.Waba]: [
    MessageTypeEnum.Text,
    MessageTypeEnum.Image,
    MessageTypeEnum.Video,
    MessageTypeEnum.Audio,
    MessageTypeEnum.File,
    MessageTypeEnum.Location,
    MessageTypeEnum.Template,
    MessageTypeEnum.RichMedia,
  ],
};

/**
 * 获取渠道的默认消息类型支持列表
 */
export const getDefaultChannelMessageTypes = (
  channel: ChannelTypeEnum,
): MessageTypeEnum[] => {
  return (
    DEFAULT_CHANNEL_MESSAGE_TYPES[channel] ?? [
      MessageTypeEnum.Text,
      MessageTypeEnum.Image,
      MessageTypeEnum.Video,
      MessageTypeEnum.Audio,
      MessageTypeEnum.File,
      MessageTypeEnum.Template,
      MessageTypeEnum.Location,
      MessageTypeEnum.RichMedia,
    ]
  );
};
