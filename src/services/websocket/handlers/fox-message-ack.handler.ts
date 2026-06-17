/**
 * 触达回复消息发送结果处理器
 *
 * @description
 * 处理触达回复消息发送结果（fox_message_ack）类型的数据包
 *
 * @module services/websocket/handlers
 */

import {
  MessageStatusEnum,
  type MessageStatusUpdatedEvent,
} from '@/interfaces/message.interface';
import {
  isPacketBodyRecord,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { messageQueue } from '@/services/messaging/message-queue.service';
import { withPacketBusinessMetadata } from '@/services/protocol/packet-business-metadata';
import { mapCallbackMessageStatusToLocal } from '@/services/protocol/status.mapper';
import { BasePacketHandler } from './base-packet.handler';

/**
 * 将任意消息 ID 值转换为字符串。
 *
 * @param value 原始消息 ID
 * @returns 标准字符串 ID；无效时返回 undefined
 */
function toMessageId(value: unknown): string | undefined {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

/**
 * 触达回复消息发送结果处理器
 *
 * @description
 * 当收到 fox_message_ack 类型的数据包时，触发触达回复消息发送结果事件
 */
export class FoxMessageAckHandler extends BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: string): boolean {
    return packetType === PacketMessageTypeEnum.FoxMessageAck;
  }

  /**
   * 处理触达回复消息发送结果数据包
   */
  handle(context: PacketHandlerContext): PacketHandlerResult {
    const { packet } = context;
    const queueResult = messageQueue.handleAck({
      id: packet.id,
      ptype: packet.ptype,
      mid: packet.mid,
      chatId: packet.chatId,
      channelType: packet.from.channelType ?? packet.to.channelType,
      timestamp: packet.timestamp,
      body: isPacketBodyRecord(packet.body)
        ? {
            ...packet.body,
            type:
              typeof packet.body.type === 'string'
                ? packet.body.type
                : PacketMessageTypeEnum.FoxMessageAck,
          }
        : {
            type: PacketMessageTypeEnum.FoxMessageAck,
          },
    });

    const rawStatusEvent =
      queueResult.statusEvent ?? this.createFallbackStatusEvent(context);
    const statusEvent = rawStatusEvent
      ? withPacketBusinessMetadata(rawStatusEvent, packet)
      : undefined;
    const extraEvents = statusEvent
      ? [
          this.createEventData(
            WebSocketEventTypeEnum.MessageStatus,
            statusEvent,
          ),
        ]
      : undefined;

    return {
      eventData: this.createEventData(
        WebSocketEventTypeEnum.FoxMessageAck,
        packet.body,
      ),
      extraEvents,
      shouldContinue: true,
    };
  }

  /**
   * 在队列未命中时直接从 fox_message_ack packet 构造状态事件。
   *
   * @description
   * RCS 点击回调可能晚于已读回调到达；如果原外发队列项已完成并出队，
   * 仍需要通过 packet.chatId 和 body.mid/id 定位原消息并更新为点击态。
   *
   * @param context 数据包处理上下文
   * @returns 可派发的消息状态事件；字段不足或状态无法解析时返回 undefined
   */
  private createFallbackStatusEvent(
    context: PacketHandlerContext,
  ): MessageStatusUpdatedEvent | undefined {
    const { packet } = context;
    if (!isPacketBodyRecord(packet.body)) {
      return undefined;
    }

    const status = mapCallbackMessageStatusToLocal(
      packet.body.status ?? packet.body.sendResult,
    );
    if (!status) {
      return undefined;
    }

    const messageId =
      toMessageId(packet.body.id) ??
      toMessageId(packet.body.mid) ??
      toMessageId(packet.mid) ??
      toMessageId(packet.id);
    const conversationId =
      typeof packet.body.chatId === 'string' && packet.body.chatId
        ? packet.body.chatId
        : this.extractChatId(packet);

    if (!messageId || !conversationId) {
      return undefined;
    }

    return {
      conversationId,
      messageId,
      channelType: packet.from.channelType ?? packet.to.channelType,
      status,
      ...(status === MessageStatusEnum.Failed &&
      typeof packet.body.errorInfo === 'string' &&
      packet.body.errorInfo
        ? { error: packet.body.errorInfo }
        : {}),
      timestamp: packet.timestamp ?? Date.now(),
    };
  }
}
