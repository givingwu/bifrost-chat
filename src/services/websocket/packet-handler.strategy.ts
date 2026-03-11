/**
 * 数据包处理器策略
 *
 * @description
 * 使用责任链模式处理不同类型的协议数据包，提高代码可维护性和可扩展性
 *
 * @module services/websocket
 */

import type {
  PacketHandlerContext,
  PacketHandlerResult,
} from '@/interfaces/websocket.interface';
import { AckHandler, PacketValidator } from '@/services/protocol';
import { HeartbeatManager } from '@/services/protocol/heartbeat.manager';
import { AckPacketHandler } from './handlers/ack-packet.handler';
import { AuthFailHandler } from './handlers/auth-fail.handler';
import type { BasePacketHandler } from './handlers/base-packet.handler';
import { ChatMessageHandler } from './handlers/chat-message.handler';
import { FoxMessageAckHandler } from './handlers/fox-message-ack.handler';
import { HeartbeatHandler } from './handlers/heartbeat.handler';
import { StatusSwitchHandler } from './handlers/status-switch.handler';
import type { WebSocketManager } from './websocket-manager.service';

/**
 * 数据包处理器策略
 *
 * @description
 * 使用责任链模式处理不同类型的数据包
 *
 * @example
 * ```typescript
 * const strategy = new PacketHandlerStrategy(wsManager);
 * const result = strategy.handle({
 *   packet: rawPacket,
 *   currentPin: 'user-123',
 * });
 * ```
 */
export class PacketHandlerStrategy {
  private handlers: BasePacketHandler[];

  constructor(wsManager: WebSocketManager) {
    // 按优先级顺序初始化处理器
    this.handlers = [
      new AuthFailHandler(),
      new HeartbeatHandler(),
      new AckPacketHandler(),
      new ChatMessageHandler(wsManager), // 传递 wsManager 给 ChatMessageHandler
      new StatusSwitchHandler(),
      new FoxMessageAckHandler(),
    ];
  }

  /**
   * 处理数据包
   *
   * @param context 处理器上下文
   * @returns 事件数据，如果没有匹配的处理器则返回 null
   */
  handle(context: PacketHandlerContext): PacketHandlerResult | null {
    const packetType = PacketValidator.getPType(context.packet);

    if (!packetType) {
      console.error('Invalid packet: missing ptype field', context.packet);
      return null;
    }

    // 责任链：找到第一个能处理该数据包的处理器
    for (const handler of this.handlers) {
      if (handler.canHandle(packetType)) {
        const result = handler.handle(context);

        // 检查是否是心跳响应（静默处理）
        if (
          HeartbeatManager.isHeartbeatResponse(context.packet) ||
          AckHandler.isHeartbeatAck(context.packet)
        ) {
          return null;
        }

        return result;
      }
    }

    // 没有匹配的处理器
    console.warn('No handler found for packet type:', packetType);
    return null;
  }

  /**
   * 添加自定义处理器
   *
   * @param handler 自定义处理器
   * @param index 插入位置（可选，默认添加到末尾）
   *
   * @example
   * ```typescript
   * class CustomHandler extends BasePacketHandler {
   *   canHandle(packetType: string): boolean {
   *     return packetType === 'custom_type';
   *   }
   *
   *   handle(context: PacketHandlerContext): PacketHandlerResult {
   *     // 自定义处理逻辑
   *   }
   * }
   *
   * strategy.addHandler(new CustomHandler());
   * ```
   */
  addHandler(handler: BasePacketHandler, index?: number): void {
    if (typeof index === 'number') {
      this.handlers.splice(index, 0, handler);
    } else {
      this.handlers.push(handler);
    }
  }

  /**
   * 移除处理器
   *
   * @param handlerClass 处理器类
   *
   * @example
   * ```typescript
   * strategy.removeHandler(ChatMessageHandler);
   * ```
   */
  removeHandler(handlerClass: new () => BasePacketHandler): void {
    this.handlers = this.handlers.filter(
      (handler) => !(handler instanceof handlerClass),
    );
  }

  /**
   * 获取所有处理器
   *
   * @returns 处理器列表
   */
  getHandlers(): BasePacketHandler[] {
    return [...this.handlers];
  }

  /**
   * 清空所有处理器
   */
  clearHandlers(): void {
    this.handlers = [];
  }
}
