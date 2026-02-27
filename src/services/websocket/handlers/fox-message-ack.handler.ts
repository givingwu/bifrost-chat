/**
 * 触达回复消息发送结果处理器
 *
 * @description
 * 处理触达回复消息发送结果（fox_message_ack）类型的数据包
 *
 * @module services/websocket/handlers
 */

import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import {
  BasePacketHandler,
  type PacketHandlerContext,
  type PacketHandlerResult,
  WebSocketEventTypeEnum,
} from '@/interfaces/websocket.interface';

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

    return {
      eventData: this.createEventData(
        WebSocketEventTypeEnum.FoxMessageAck,
        packet.body,
      ),
      shouldContinue: true,
    };
  }
}
