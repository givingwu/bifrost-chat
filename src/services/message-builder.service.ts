import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type SendMessageOptions,
  type StandardMessage,
  type StringMessage,
} from '@/interfaces/message.interface';

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
      senderId: string;
      receiverId: string;
      channelType: ChannelTypeEnum;
    },
  ): StandardMessage {
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
        id: options.senderId,
        app: 'bifrost-chat-sdk',
        clientType: 'web',
        channelType: options.channelType,
      },
      receiver: options.receiver ?? {
        id: options.receiverId,
        channelType: options.channelType,
      },
    };
  }

  /**
   * 生成消息 ID
   */
  static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 生成临时消息 ID
   */
  static generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
}
