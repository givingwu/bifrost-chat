import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type {
  ILocationMessage,
  IMediaMessage,
  IRichMediaMessage,
  IStringMessage,
  ITemplateMessage,
  MessageContent,
} from '@/interfaces/message.interface';
import {
  type ClientTypeEnum,
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type SendMessageOptions,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  isPacketBodyRecord,
  type LocationPacketBody,
  type MediaPacketBody,
  type PacketBody,
  PacketMessageTypeEnum,
  type RichMediaPacketBody,
  type TemplatePacketBody,
  type TextPacketBody,
} from '@/interfaces/protocol.interface';

/**
 * 类型守卫函数
 * 用于在运行时安全地判断 Packet body 的具体类型
 */

/**
 * 判断是否为文本 Packet body
 */
function isTextPacketBody(body: unknown): body is TextPacketBody {
  return isPacketBodyRecord(body) && body.type === MessageTypeEnum.Text;
}

/**
 * 判断是否为多媒体 Packet body
 */
function isMediaPacketBody(body: unknown): body is MediaPacketBody {
  return (
    isPacketBodyRecord(body) &&
    [
      MessageTypeEnum.Image,
      MessageTypeEnum.Audio,
      MessageTypeEnum.Video,
      MessageTypeEnum.File,
    ].includes(body.type as MessageTypeEnum)
  );
}

/**
 * 判断是否为模板 Packet body
 */
function isTemplatePacketBody(body: unknown): body is TemplatePacketBody {
  return isPacketBodyRecord(body) && body.type === MessageTypeEnum.Template;
}

/**
 * 判断是否为位置 Packet body
 */
function isLocationPacketBody(body: unknown): body is LocationPacketBody {
  return isPacketBodyRecord(body) && body.type === MessageTypeEnum.Location;
}

/**
 * 判断是否为富媒体 Packet body
 */
function isRichMediaPacketBody(body: unknown): body is RichMediaPacketBody {
  return isPacketBodyRecord(body) && body.type === MessageTypeEnum.RichMedia;
}

/**
 * 转换函数：每种消息类型独立实现
 * 确保返回的 MessageContent 符合类型定义
 */

/**
 * 将文本 Packet body 转换为 IStringMessage
 */
function convertTextPacketBody(content: IStringMessage): IStringMessage {
  return {
    text: content.text ?? '',
  };
}

/**
 * 将多媒体 Packet body 转换为 IMediaMessage
 */
function convertMediaPacketBody(
  packetType: MediaPacketBody['type'],
  content: IMediaMessage,
): IMediaMessage {
  return {
    url: content.url,
    mimeType: content.mimeType ?? getDefaultMimeType(packetType),
    size: content.size,
  };
}

/**
 * 将模板 Packet body 转换为 ITemplateMessage
 */
function convertTemplatePacketBody(
  content: ITemplateMessage,
): ITemplateMessage {
  return {
    text: content.text ?? '',
    templateId: content.templateId ?? '',
    params: content.params ?? {},
  };
}

/**
 * 将位置 Packet body 转换为 ILocationMessage
 */
function convertLocationPacketBody(
  content: ILocationMessage,
): ILocationMessage {
  return {
    address: content.address ?? '',
  };
}

/**
 * 将富媒体 Packet body 转换为 IRichMediaMessage
 */
function convertRichMediaPacketBody(
  content: IRichMediaMessage,
): IRichMediaMessage {
  return {
    desc: content.desc,
    text: content.text,
    url: content.url,
    mimeType: content.mimeType ?? 'application/octet-stream',
    size: content.size,
  };
}

/**
 * 获取默认 MIME 类型
 */
function getDefaultMimeType(type: string): string {
  const defaults: Record<string, string> = {
    image: 'image/jpeg',
    audio: 'audio/webm',
    video: 'video/mp4',
    file: 'application/octet-stream',
  };
  return defaults[type] || 'application/octet-stream';
}

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
      conversationId: string;
    },
  ): StandardMessage {
    // 验证必需字段
    if (!options.fromPin || !options.toPin) {
      throw new Error('fromPin and toPin are required');
    }

    if (!options.conversationId) {
      throw new Error('conversationId is required');
    }

    return {
      id: MessageBuilder.generateId(),
      tempId: MessageBuilder.generateTempId(),
      conversationId: options.conversationId,
      direction: MessageDirectionEnum.Outgoing,
      channelType: options.channelType,
      status: MessageStatusEnum.Created,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: {
        text,
      },
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
  static generateTempId(prefix = 'chat'): string {
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
  static messageTypeToPacketType(type: MessageTypeEnum): PacketMessageTypeEnum {
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
  static packetBodyToMessageType(body: unknown): MessageTypeEnum {
    if (typeof body === 'string') {
      return MessageTypeEnum.Text;
    }

    // AckDataBody 没有 type 属性，返回 Other
    if (!isPacketBodyRecord(body) || typeof body.type !== 'string') {
      return MessageTypeEnum.Other;
    }

    switch (body.type) {
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
  ): PacketBody {
    return {
      type: MessageBuilder.messageTypeToString(type),
      content,
    };
  }

  /**
   * 将 Packet body 转换为 MessageContent
   * 使用类型守卫和独立转换函数确保类型安全
   */
  static packetBodyToMessageContent(body: unknown): MessageContent {
    if (typeof body === 'string') {
      return {
        text: body,
      };
    }

    if (isTextPacketBody(body)) {
      return convertTextPacketBody(body.content);
    }

    if (isMediaPacketBody(body)) {
      return convertMediaPacketBody(body.type, body.content);
    }

    if (isTemplatePacketBody(body)) {
      return convertTemplatePacketBody(body.content);
    }

    if (isLocationPacketBody(body)) {
      return convertLocationPacketBody(body.content);
    }

    if (isRichMediaPacketBody(body)) {
      return convertRichMediaPacketBody(body.content);
    }

    // 降级处理：未知类型返回空文本消息
    // AckDataBody 或其他没有 type 属性的类型
    if (!isPacketBodyRecord(body) || typeof body.type !== 'string') {
      return {
        text: 'Unsupported message type',
      };
    }

    return {
      text: `Unsupported type ${body.type}`,
    };
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
