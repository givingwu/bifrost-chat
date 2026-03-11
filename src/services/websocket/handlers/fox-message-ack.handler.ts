/**
 * 触达回复消息发送结果处理器
 *
 * @description
 * 处理触达回复消息发送结果（fox_message_ack）类型的数据包
 *
 * @module services/websocket/handlers
 */

import {
  isPacketBodyRecord,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import { BasePacketHandler } from './base-packet.handler';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { messageQueue } from '@/services/messaging/message-queue.service';

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

    const extraEvents = queueResult.statusEvent
      ? [
        this.createEventData(
          WebSocketEventTypeEnum.MessageStatus,
          queueResult.statusEvent,
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
}
