import type { ChannelType } from '@/interfaces/channel.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
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
      channelType: ChannelType;
    },
  ): StandardMessage {
    return {
      id: MessageBuilder.generateId(),
      tempId: MessageBuilder.generateTempId(),
      direction: MessageDirection.Outgoing,
      channelType: options.channelType,
      status: MessageStatus.Created,
      timestamp: Date.now(),
      type: options.type ?? MessageType.Text,
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
  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 生成临时消息 ID
   */
  private static generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
