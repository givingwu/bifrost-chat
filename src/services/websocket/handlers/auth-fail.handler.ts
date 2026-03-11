/**
 * 登录失败处理器
 *
 * @description
 * 处理登录失败（auth_fail）类型的数据包
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
 * 登录失败处理器
 *
 * @description
 * 当收到 auth_fail 类型的数据包时，触发登录失败事件
 */
export class AuthFailHandler extends BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: string): boolean {
    return packetType === PacketMessageTypeEnum.AuthFail;
  }

  /**
   * 处理登录失败数据包
   */
  handle(context: PacketHandlerContext): PacketHandlerResult {
    const { packet } = context;

    return {
      eventData: this.createEventData(
        WebSocketEventTypeEnum.AuthFail,
        packet.body,
      ),
      shouldContinue: true, // 继续分发事件
    };
  }
}
