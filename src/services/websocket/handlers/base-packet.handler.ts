/**
 * 基础数据包处理器
 *
 * @description
 * 定义所有数据包处理器的抽象基类，提供通用的辅助方法
 *
 * @module services/websocket/handlers
 */

import type { AckRawPacket, RawPacket } from '@/interfaces/protocol.interface';
import type {
  PacketHandlerContext,
  PacketHandlerResult,
  WebSocketEventData,
  WebSocketEventTypeEnum,
} from '@/interfaces/websocket.interface';

/**
 * 抽象数据包处理器
 *
 * @description
 * 所有具体处理器都必须继承此类并实现 `canHandle` 和 `handle` 方法
 */
export abstract class BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   *
   * @param packetType 数据包类型
   * @returns 是否可以处理
   */
  abstract canHandle(packetType: string): boolean;

  /**
   * 处理数据包
   *
   * @param context 处理器上下文
   * @returns 处理结果
   */
  abstract handle(context: PacketHandlerContext): PacketHandlerResult;

  /**
   * 提取会话 ID
   *
   * @param packet 数据包
   * @returns 会话 ID（如果不存在则返回空字符串）
   */
  protected extractChatId(packet: RawPacket | AckRawPacket): string {
    return packet.chatId;
  }

  /**
   * 提取时间戳
   *
   * @param packet 数据包
   * @returns 时间戳
   */
  protected extractTimestamp(packet: RawPacket | AckRawPacket): number {
    return packet.timestamp ?? Date.now();
  }

  /**
   * 创建事件数据
   *
   * @param type 事件类型
   * @param data 事件数据
   * @returns WebSocket 事件数据
   */
  protected createEventData(
    type: WebSocketEventTypeEnum,
    data: unknown,
  ): WebSocketEventData {
    return {
      type,
      data,
      timestamp: Date.now(),
    };
  }
}
