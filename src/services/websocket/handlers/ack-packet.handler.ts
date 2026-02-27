/**
 * ACK 数据包处理器
 *
 * @description
 * 处理 ACK 确认消息，包括发送失败、已收、已读等状态
 *
 * @module services/websocket/handlers
 */

import { MessageStatusEnum } from '@/interfaces/message.interface';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import {
  BasePacketHandler,
  type PacketHandlerContext,
  type PacketHandlerResult,
  WebSocketEventTypeEnum,
} from '@/interfaces/websocket.interface';
import { AckHandler } from '@/services/protocol';

/**
 * ACK 数据包处理器
 *
 * @description
 * 处理各种类型的 ACK 消息：
 * - msg_send_failed: 消息发送失败
 * - msg_receive_ack: 客户端已收
 * - msg_read_ack: 客户端已读
 */
export class AckPacketHandler extends BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: string): boolean {
    return packetType === PacketMessageTypeEnum.Ack;
  }

  /**
   * 处理 ACK 数据包
   */
  handle(context: PacketHandlerContext): PacketHandlerResult {
    const { packet } = context;

    const ackData = AckHandler.parseDownstream(packet);

    if (!ackData) {
      return { eventData: null, shouldContinue: false };
    }

    // 验证 ACK 类型
    if (!AckHandler.isValidAckType(ackData.body.type)) {
      console.error('Invalid ACK type:', ackData.body.type);
      return { eventData: null, shouldContinue: false };
    }

    // 处理发送失败 ACK
    if (AckHandler.isSendFailedAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          conversationId: this.extractChatId(packet),
          messageId: ackData.id,
          status: MessageStatusEnum.Failed,
          timestamp: ackData.timestamp ?? Date.now(),
        }),
        shouldContinue: true,
      };
    }

    // 处理客户端已收
    if (AckHandler.isReceiveAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          conversationId: this.extractChatId(packet),
          messageId: ackData.id,
          status: MessageStatusEnum.Delivered,
          timestamp: ackData.timestamp ?? Date.now(),
        }),
        shouldContinue: true,
      };
    }

    // 处理客户端已读
    if (AckHandler.isReadAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          conversationId: this.extractChatId(packet),
          messageId: ackData.id,
          status: MessageStatusEnum.Read,
          timestamp: ackData.timestamp ?? Date.now(),
        }),
        shouldContinue: true,
      };
    }

    // 其他 ACK 类型
    return {
      eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
        conversationId: this.extractChatId(packet),
        messageId: ackData.id,
        status: AckHandler.ackTypeToMessageStatus(ackData.body.type),
        timestamp: ackData.timestamp ?? Date.now(),
      }),
      shouldContinue: true,
    };
  }
}
