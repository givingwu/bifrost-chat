/**
 * 聊天消息处理器
 *
 * @description
 * 处理聊天消息（chat_message）类型的数据包，并自动发送接收 ACK
 *
 * @module services/websocket/handlers
 */

import type { RawPacket } from '@/interfaces/protocol.interface';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { MessageBuilder } from '@/services/messaging/message-builder.service';
import { PacketConverter } from '@/services/protocol';
import type { WebSocketManager } from '../websocket-manager.service';
import { BasePacketHandler } from './base-packet.handler';

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
    const message = PacketConverter.toStandardMessage(
      packet as RawPacket,
      undefined,
      currentPin,
    );

    // 自动发送 msg_receive_ack
    this.sendReceiveAck(packet as RawPacket);

    return {
      eventData: this.createEventData(WebSocketEventTypeEnum.Message, {
        // chatId 对于 chat_message 类型一定存在（服务端保证）
        conversationId: packet.chatId,
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
  private sendReceiveAck(rawPacket: RawPacket): void {
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

    try {
      this.wsManager.sendReceiveAck(
        {
          sender: rawPacket.from.pin,
          app: rawPacket.from.app,
          mid: rawPacket.mid,
          // chatId 对于 chat_message 类型一定存在（服务端保证）
          chatId: rawPacket.chatId,
          timestamp: rawPacket.timestamp,
        },
        {
          targetMessageId: String(rawPacket.mid ?? rawPacket.id),
          targetTempId: rawPacket.id,
          channelType:
            MessageBuilder.stringToChannelType(rawPacket.from.channelType) ??
            MessageBuilder.stringToChannelType(rawPacket.to.channelType),
        },
      );
    } catch (error) {
      // ACK 发送失败不应影响消息处理流程
      console.error('[ChatMessageHandler] Failed to send receive ACK:', error);
    }
  }
}
