import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  type ClientTypeEnum,
  type MessageContent,
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type SendMessageOptions,
  type StandardMessage,
  type StringMessage,
} from '@/interfaces/message.interface';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';

/**
 * MessageBuilder：消息构建器
 * 负责构建标准化的消息对象
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <MessageBuilder needs to be a static utility class>
export class MessageBuilder {
  /**
   * 构建文本消息
   */
  static buildTextMessage(
    text: string,
    options: SendMessageOptions & {
      fromApp?: string;
      fromPin: string;
      toApp?: string;
      toPin: string;
      channelType: ChannelTypeEnum;
      clientType?: ClientTypeEnum;
    },
  ): StandardMessage {
    // 验证必需字段
    if (!options.fromPin || !options.toPin) {
      throw new Error('fromPin and toPin are required');
    }

    return {
      id: MessageBuilder.generateId(),
      tempId: MessageBuilder.generateTempId(),
      direction: MessageDirectionEnum.Outgoing,
      channelType: options.channelType,
      status: MessageStatusEnum.Created,
      timestamp: Date.now(),
      type: options.type ?? MessageTypeEnum.Text,
      content: { text } as StringMessage,
      sender: options.sender ?? {
        app: options.fromApp as string,
        pin: options.fromPin,
        clientType: options.clientType,
        channelType: options.channelType,
      },
      receiver: options.receiver ?? {
        app: options.toApp as string,
        pin: options.toPin,
        channelType: options.channelType,
      },
    };
  }

  /**
   * 生成消息 ID
   */
  static generateId(prefix = 'msg'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 生成临时消息 ID
   */
  static generateTempId(prefix = 'temp'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 生成唯一 UUID
   */
  static generateUniqueId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 将 MessageTypeEnum 转换为 Packet Type 字符串
   */
  static messageTypeToPacketType(type: MessageTypeEnum): string {
    const typeMap: Record<MessageTypeEnum, PacketMessageTypeEnum> = {
      [MessageTypeEnum.Text]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Image]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Audio]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Video]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.File]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Template]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Location]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.RichMedia]: PacketMessageTypeEnum.ChatMessage,
      [MessageTypeEnum.Other]: PacketMessageTypeEnum.ChatMessage,
    };

    return typeMap[type] || PacketMessageTypeEnum.ChatMessage;
  }

  /**
   * 从 Packet body 解析 MessageTypeEnum
   */
  static packetBodyToMessageType(
    body: Record<string, unknown>,
  ): MessageTypeEnum {
    const type = (body.type as string) || 'text';

    switch (type) {
      case 'text':
        return MessageTypeEnum.Text;
      case 'image':
        return MessageTypeEnum.Image;
      case 'audio':
        return MessageTypeEnum.Audio;
      case 'video':
        return MessageTypeEnum.Video;
      case 'file':
        return MessageTypeEnum.File;
      case 'template':
        return MessageTypeEnum.Template;
      case 'location':
        return MessageTypeEnum.Location;
      case 'rich_media':
        return MessageTypeEnum.RichMedia;
      default:
        return MessageTypeEnum.Other;
    }
  }

  /**
   * 将 MessageContent 转换为 Packet body
   */
  static messageContentToPacketBody(
    type: MessageTypeEnum,
    content: MessageContent,
  ): Record<string, unknown> {
    return {
      type: MessageBuilder.messageTypeToString(type),
      content,
    };
  }

  /**
   * 将 Packet body 转换为 MessageContent
   */
  static packetBodyToMessageContent(
    body: Record<string, unknown>,
  ): MessageContent {
    const type = (body.type as string) || 'text';
    const content = body.content as Record<string, unknown>;

    switch (type) {
      case 'text':
        return { text: (content?.text as string) || '' };

      case 'image':
        return {
          url: (content?.url as string) || '',
          mimeType: (content?.mimeType as string) || 'image/jpeg',
          size: content?.size as number,
        };

      case 'audio':
        return {
          url: (content?.url as string) || '',
          mimeType: (content?.mimeType as string) || 'audio/webm',
          size: content?.size as number,
        };

      case 'video':
        return {
          url: (content?.url as string) || '',
          mimeType: (content?.mimeType as string) || 'video/mp4',
          size: content?.size as number,
        };

      case 'file':
        return {
          url: (content?.url as string) || '',
          mimeType: (content?.mimeType as string) || 'application/octet-stream',
          size: content?.size as number,
        };

      case 'template':
        return {
          text: (content?.text as string) || '',
          templateId: (content?.templateId as string | number) || '',
          params: (content?.params as Record<string, string>) || {},
        };

      case 'location':
        return {
          text: (content?.address as string) || '',
        };

      case 'rich_media':
        return {
          text: (content?.description as string) || '',
        };

      default:
        return { text: '' };
    }
  }

  /**
   * 将 MessageTypeEnum 转换为字符串
   */
  static messageTypeToString(type: MessageTypeEnum): MessageTypeEnum {
    return type;
  }

  /**
   * 将字符串转换为 MessageTypeEnum
   */
  static stringToMessageType(type: string): MessageTypeEnum {
    switch (type) {
      case 'text':
        return MessageTypeEnum.Text;
      case 'image':
        return MessageTypeEnum.Image;
      case 'audio':
        return MessageTypeEnum.Audio;
      case 'video':
        return MessageTypeEnum.Video;
      case 'file':
        return MessageTypeEnum.File;
      case 'template':
        return MessageTypeEnum.Template;
      case 'location':
        return MessageTypeEnum.Location;
      case 'rich_media':
        return MessageTypeEnum.RichMedia;
      default:
        return MessageTypeEnum.Other;
    }
  }

  /**
   * 将字符串转换为 ChannelTypeEnum
   */
  static stringToChannelType(channelType?: string): ChannelTypeEnum {
    if (!channelType) {
      return ChannelTypeEnum.SMS;
    }

    const normalizedType = channelType.toLowerCase();

    if (normalizedType === 'whatsapp' || normalizedType === 'waba') {
      return ChannelTypeEnum.WhatsApp;
    }
    if (normalizedType === 'email') {
      return ChannelTypeEnum.Email;
    }
    if (normalizedType === 'sms') {
      return ChannelTypeEnum.SMS;
    }

    return ChannelTypeEnum.SMS;
  }

  /**
   * 将 ChannelTypeEnum 转换为字符串
   */
  static channelTypeToString(channelType: ChannelTypeEnum): ChannelTypeEnum {
    return channelType;
  }
}
