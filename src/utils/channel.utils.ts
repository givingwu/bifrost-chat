/**
 * 渠道工具函数
 *
 * @description
 * 按渠道划分的消息类型支持配置及工具函数
 */

import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';

/**
 * 各渠道的默认消息类型支持列表
 */
export const DEFAULT_CHANNEL_MESSAGE_TYPES: Partial<
  Record<ChannelTypeEnum, MessageTypeEnum[]>
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

  // Viber: 支持多种消息类型
  [ChannelTypeEnum.Viber]: [
    MessageTypeEnum.Text,
    MessageTypeEnum.Image,
    MessageTypeEnum.Video,
    MessageTypeEnum.Audio,
    MessageTypeEnum.File,
    MessageTypeEnum.Location,
    MessageTypeEnum.Template,
  ],
  // IVR 语音渠道暂不支持（IM 侧不展示）
};

/**
 * 获取渠道的默认消息类型支持列表
 */
export function getDefaultChannelMessageTypes(
  channel: ChannelTypeEnum,
): MessageTypeEnum[] {
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
}
