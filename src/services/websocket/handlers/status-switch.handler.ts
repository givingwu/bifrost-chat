/**
 * 状态切换处理器
 *
 * @description
 * 处理状态切换（status_switch）类型的数据包
 *
 * @module services/websocket/handlers
 */

import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { BasePacketHandler } from './base-packet.handler';

/**
 * 状态切换处理器
 *
 * @description
 * 当收到 status_switch 类型的数据包时，触发状态切换事件
 */
export class StatusSwitchHandler extends BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: string): boolean {
    return packetType === PacketMessageTypeEnum.StatusSwitch;
  }

  /**
   * 处理状态切换数据包
   */
  handle(context: PacketHandlerContext): PacketHandlerResult {
    const { packet } = context;

    return {
      eventData: this.createEventData(
        WebSocketEventTypeEnum.StatusSwitch,
        packet.body,
      ),
      shouldContinue: true,
    };
  }
}
