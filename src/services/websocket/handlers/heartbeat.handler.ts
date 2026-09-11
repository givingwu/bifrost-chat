/**
 * 心跳处理器
 *
 * @description
 * 处理心跳响应（client_heartbeat）类型的数据包
 *
 * @module services/websocket/handlers
 */

import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { BasePacketHandler } from './base-packet.handler';

/**
 * 心跳处理器
 *
 * @description
 * 当收到心跳响应时，静默处理，不向上层分发事件
 */
export class HeartbeatHandler extends BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   */
  canHandle(packetType: string): boolean {
    return packetType === PacketMessageTypeEnum.ClientHeartbeat;
  }

  /**
   * 处理心跳数据包
   */
  handle(_context: PacketHandlerContext): PacketHandlerResult {
    // 心跳响应不需要分发到上层
    return { eventData: null, shouldContinue: false };
  }
}
