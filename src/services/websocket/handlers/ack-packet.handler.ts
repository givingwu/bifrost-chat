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
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import { AckHandler } from '@/services/protocol';

/**
 * ACK 数据包处理器
 *
 * @description
 * 处理各种类型的 ACK 消息：
 * - msg_send_failed: 消息发送失败
 * - msg_receive_ack: 客户端已收
 * - msg_read_ack: 客户端已读
 *
 * 当 ACK 中 chatId 为 null 时，会从 PendingMessageTracker 中查找对应的 conversationId。
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

    // 获取 conversationId：优先使用 packet.chatId，否则从映射表查找
    const conversationId = this.resolveConversationId(packet, ackData.id);

    if (!conversationId) {
      console.warn('[AckPacketHandler] 无法确定 conversationId，跳过状态更新', {
        messageId: ackData.id,
        packetChatId: packet.chatId,
        bodyType: ackData.body.type,
      });
      return { eventData: null, shouldContinue: false };
    }

    // 处理完成后移除映射（无论成功与否）
    this.cleanupMapping(ackData.id);

    // 构建 ACK 事件数据
    const ackEventData = {
      conversationId,
      messageId: ackData.id,
      channelType: packet.from.channelType ?? packet.to.channelType,
      timestamp: ackData.timestamp ?? Date.now(),
    };

    // 处理发送失败 ACK
    if (AckHandler.isSendFailedAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          ...ackEventData,
          status: MessageStatusEnum.Failed,
        }),
        shouldContinue: true,
      };
    }

    // 处理客户端已收
    if (AckHandler.isReceiveAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          ...ackEventData,
          status: MessageStatusEnum.Delivered,
        }),
        shouldContinue: true,
      };
    }

    // 处理客户端已读
    if (AckHandler.isReadAck(packet)) {
      return {
        eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
          ...ackEventData,
          status: MessageStatusEnum.Read,
        }),
        shouldContinue: true,
      };
    }

    // 其他 ACK 类型
    return {
      eventData: this.createEventData(WebSocketEventTypeEnum.MessageStatus, {
        ...ackEventData,
        status: AckHandler.ackTypeToMessageStatus(ackData.body.type),
      }),
      shouldContinue: true,
    };
  }

  /**
   * 解析 conversationId
   *
   * @description
   * 优先使用 packet.chatId，如果为 null 或空字符串则从 PendingMessageTracker 查找
   *
   * @param packet 数据包
   * @param messageId 消息 ID
   * @returns conversationId，如果无法确定则返回 undefined
   */
  private resolveConversationId(
    packet: Parameters<typeof this.extractChatId>[0],
    messageId: string,
  ): string | undefined {
    // 优先使用 packet.chatId
    const packetChatId = this.extractChatId(packet);
    if (packetChatId) {
      return packetChatId;
    }

    // 从映射表查找
    const trackedConversationId = pendingMessageTracker.get(messageId);

    if (trackedConversationId) {
      console.info('[AckPacketHandler] 从映射表获取 conversationId', {
        messageId,
        conversationId: trackedConversationId,
      });
      return trackedConversationId;
    }

    return undefined;
  }

  /**
   * 清理映射
   *
   * @description
   * 处理完成后移除映射，避免内存泄漏
   *
   * @param messageId 消息 ID
   */
  private cleanupMapping(messageId: string): void {
    pendingMessageTracker.remove(messageId);
  }
}
