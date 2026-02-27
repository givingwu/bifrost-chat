/**
 * 聊天消息处理器
 *
 * @description
 * 处理聊天消息（chat_message）类型的数据包，并自动发送接收 ACK
 *
 * @module services/websocket/handlers
 */

import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { ClientTypeEnum } from '@/interfaces/message.interface';
import type { AckRawPacket, RawPacket } from '@/interfaces/protocol.interface';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import {
  BasePacketHandler,
  type PacketHandlerContext,
  type PacketHandlerResult,
  WebSocketEventTypeEnum,
} from '@/interfaces/websocket.interface';
import { MessageAckHelper } from '@/services/message-ack-helper.service';
import { PacketConverter } from '@/services/protocol';
import type { WebSocketManager } from '../websocket-manager.service';

/**
 * 聊天消息处理器
 *
 * @description
 * 当收到 chat_message 类型的数据包时，将其转换为标准消息格式
 * 并自动发送 msg_receive_ack 给服务端
 */
export class ChatMessageHandler extends BasePacketHandler {
  /**
   * 构造函数
   *
   * @param wsManager WebSocketManager 实例（可选，用于发送 ACK）
   */
  constructor(private wsManager: WebSocketManager) {
    super();
  }

  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: PacketMessageTypeEnum): boolean {
    return packetType === PacketMessageTypeEnum.ChatMessage;
  }

  /**
   * 处理聊天消息数据包
   */
  handle(context: PacketHandlerContext): PacketHandlerResult {
    const { packet, currentPin } = context;

    // 确保 packet 是 RawPacket
    const rawPacket = this.normalizeToRawPacket(packet);
    const message = PacketConverter.toStandardMessage(
      rawPacket,
      undefined,
      currentPin,
    );

    // 自动发送 msg_receive_ack
    this.sendReceiveAck(rawPacket, currentPin);

    return {
      eventData: this.createEventData(WebSocketEventTypeEnum.Message, {
        conversationId: rawPacket.chatId ?? message.receiver?.pin ?? '',
        message,
      }),
      shouldContinue: true,
    };
  }

  /**
   * 发送消息接收 ACK
   *
   * @description
   * 收到 chat_message 后自动发送 msg_receive_ack 给服务端
   *
   * @param rawPacket 原始数据包
   * @param currentPin 当前用户 PIN
   */
  private sendReceiveAck(rawPacket: RawPacket, currentPin?: string): void {
    // 如果没有 WebSocketManager，跳过 ACK 发送
    if (!this.wsManager) {
      console.warn('[ChatMessageHandler] WebSocketManager not available');
      return;
    }

    // 如果没有服务端消息 ID（mid），无法发送 ACK
    if (!rawPacket.mid) {
      console.warn(
        '[ChatMessageHandler] Missing server message ID (mid), skipping receive ACK',
      );
      return;
    }

    // 如果没有会话 ID（chatId），记录警告但继续发送
    if (!rawPacket.chatId) {
      console.warn(
        '[ChatMessageHandler] Missing chatId in packet, receive ACK may be incomplete',
      );
    }

    try {
      MessageAckHelper.sendReceiveAck(this.wsManager, {
        sender: currentPin || rawPacket.to.pin || '',
        app: rawPacket.to.app,
        messageId: rawPacket.mid,
        chatId: rawPacket.chatId || '',
        datetime: rawPacket.timestamp,
        toApp: rawPacket.from.app,
        toPin: rawPacket.from.pin,
      });
    } catch (error) {
      // ACK 发送失败不应影响消息处理流程
      console.error('[ChatMessageHandler] Failed to send receive ACK:', error);
    }
  }

  /**
   * 将数据包标准化为 RawPacket 格式
   */
  private normalizeToRawPacket(data: RawPacket | AckRawPacket): RawPacket {
    const from = this.isRecord(data.from) ? data.from : undefined;
    const to = this.isRecord(data.to) ? data.to : undefined;

    return {
      id: typeof data.id === 'string' ? data.id : '',
      mid: typeof data.mid === 'string' ? data.mid : undefined,
      from: {
        app: from && typeof from.app === 'string' ? from.app : '',
        pin: from && typeof from.pin === 'string' ? from.pin : '',
        clientType:
          from && typeof from.clientType === 'string'
            ? (from.clientType as ClientTypeEnum)
            : undefined,
        channelType:
          from && typeof from.channelType === 'string'
            ? (from.channelType as ChannelTypeEnum)
            : undefined,
      },
      to: {
        app: to && typeof to.app === 'string' ? to.app : '',
        pin: to && typeof to.pin === 'string' ? to.pin : '',
        clientType:
          to && typeof to.clientType === 'string'
            ? (to.clientType as ClientTypeEnum)
            : undefined,
        channelType:
          to && typeof to.channelType === 'string'
            ? (to.channelType as ChannelTypeEnum)
            : undefined,
      },
      ptype:
        typeof data.ptype === 'string'
          ? (data.ptype as PacketMessageTypeEnum)
          : PacketMessageTypeEnum.Ack,
      body: (this.isRecord(data.body)
        ? data.body
        : {}) as unknown as RawPacket['body'],
      ver: typeof data.ver === 'string' ? data.ver : '1.0',
      timestamp:
        typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      chatId: typeof data.chatId === 'string' ? data.chatId : undefined,
      entry: typeof data.entry === 'string' ? data.entry : undefined,
    };
  }

  /**
   * 类型守卫：判断是否为 Record 类型
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
  }
}
