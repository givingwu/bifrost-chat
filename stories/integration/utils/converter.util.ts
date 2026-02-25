import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';

export type JsonRecord = Record<string, unknown>;

export const toRecord = (value: unknown): JsonRecord =>
  value && typeof value === 'object' ? (value as JsonRecord) : {};

export const toChannel = (value: unknown): ChannelTypeEnum => {
  const lower = typeof value === 'string' ? value.toLowerCase() : '';
  if (lower === ChannelTypeEnum.SMS) {
    return ChannelTypeEnum.SMS;
  }
  if (lower === ChannelTypeEnum.Email) {
    return ChannelTypeEnum.Email;
  }
  if (lower === ChannelTypeEnum.Waba) {
    return ChannelTypeEnum.Waba;
  }
  return ChannelTypeEnum.WhatsApp;
};

export const toMessageType = (value: unknown): MessageTypeEnum => {
  const lower = typeof value === 'string' ? value.toLowerCase() : '';

  if (lower === MessageTypeEnum.Image) {
    return MessageTypeEnum.Image;
  }
  if (lower === MessageTypeEnum.Audio || lower === 'voice') {
    return MessageTypeEnum.Audio;
  }
  if (lower === MessageTypeEnum.Video) {
    return MessageTypeEnum.Video;
  }
  if (lower === MessageTypeEnum.File) {
    return MessageTypeEnum.File;
  }
  if (lower === MessageTypeEnum.Template) {
    return MessageTypeEnum.Template;
  }
  if (lower === MessageTypeEnum.Location) {
    return MessageTypeEnum.Location;
  }
  if (lower === MessageTypeEnum.RichMedia) {
    return MessageTypeEnum.RichMedia;
  }

  return MessageTypeEnum.Text;
};
