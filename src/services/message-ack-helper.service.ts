/**
 * Message ACK Helper - 消息确认辅助工具
 *
 * @description
 * 提供消息 ACK（确认）发送的辅助方法，简化调用方的实现。
 * 用于在 IMessageService.markAsRead() 实现中发送 msg_read_ack。
 *
 * @module services/message-ack-helper
 *
 * @example
 * ```typescript
 * // 调用方实现 IMessageService
 * class MyMessageService implements IMessageService {
 *   async markAsRead(params: { conversationId: string; messageIds: string[] }): Promise<void> {
 *     // 1. 调用后端 API 标记已读
 *     await api.markAsRead(params);
 *
 *     // 2. 发送 msg_read_ack（使用辅助工具）
 *     for (const messageId of params.messageIds) {
 *       MessageAckHelper.sendReadAck(this.wsManager, {
 *         sender: this.currentPin,
 *         app: this.currentApp,
 *         messageId,
 *         chatId: params.conversationId,
 *         datetime: Date.now(),
 *         toApp: 'im.waiter',
 *         toPin: 'customer-pin',
 *       });
 *     }
 *   }
 * }
 * ```
 */

import type { ReadAckParams } from '@/interfaces/protocol.interface';
import type { WebSocketManager } from './websocket/websocket-manager.service';

/**
 * MessageAckHelper - 消息确认辅助工具类
 *
 * @description
 * 提供静态方法简化消息 ACK 的发送逻辑
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <This is a utility class with only static methods, no need for instantiation>
export class MessageAckHelper {
  /**
   * 发送消息已读 ACK
   *
   * @description
   * 辅助方法，用于在 IMessageService.markAsRead() 实现中发送已读 ACK
   *
   * @param wsManager WebSocketManager 实例
   * @param params 已读 ACK 参数
   *
   * @example
   * ```typescript
   * MessageAckHelper.sendReadAck(wsManager, {
   *   sender: 'agent-123',
   *   app: 'fox_collect.waiter',
   *   messageId: 'msg-456',
   *   chatId: 'conv-123',
   *   datetime: Date.now(),
   *   toApp: 'im.waiter',
   *   toPin: 'customer-456',
   * });
   * ```
   */
  static sendReadAck(wsManager: WebSocketManager, params: ReadAckParams): void {
    if (!wsManager.isConnected()) {
      console.warn(
        '[MessageAckHelper] WebSocket not connected, skipping read ACK',
      );
      return;
    }

    try {
      wsManager.sendReadAck(params);
    } catch (error) {
      console.error('[MessageAckHelper] Failed to send read ACK:', error);
      // 不抛出错误，避免影响已读标记流程
    }
  }

  /**
   * 批量发送消息已读 ACK
   *
   * @description
   * 用于处理批量已读场景，遍历发送多个 ACK
   *
   * @param wsManager WebSocketManager 实例
   * @param ackParamsList 已读参数列表
   *
   * @example
   * ```typescript
   * const ackParams = messageIds.map(messageId => ({
   *   sender: 'agent-123',
   *   app: 'fox_collect.waiter',
   *   messageId,
   *   chatId: 'conv-123',
   *   datetime: Date.now(),
   *   toApp: 'im.waiter',
   *   toPin: 'customer-456',
   * }));
   *
   * MessageAckHelper.sendReadAckBatch(wsManager, ackParams);
   * ```
   */
  static sendReadAckBatch(
    wsManager: WebSocketManager,
    ackParamsList: ReadAckParams[],
  ): void {
    if (!wsManager.isConnected()) {
      console.warn(
        '[MessageAckHelper] WebSocket not connected, skipping read ACK batch',
      );
      return;
    }

    for (const params of ackParamsList) {
      try {
        wsManager.sendReadAck(params);
      } catch (error) {
        console.error(
          '[MessageAckHelper] Failed to send read ACK for message:',
          params.messageId,
          error,
        );
        // 继续发送其他 ACK，不中断批量操作
      }
    }
  }

  /**
   * 发送消息接收 ACK
   *
   * @description
   * 辅助方法，用于在收到消息后发送接收 ACK
   *
   * @param wsManager WebSocketManager 实例
   * @param params 接收 ACK 参数
   *
   * @example
   * ```typescript
   * MessageAckHelper.sendReceiveAck(wsManager, {
   *   sender: 'agent-123',
   *   app: 'fox_collect.waiter',
   *   messageId: 'msg-456',
   *   chatId: 'conv-123',
   *   datetime: Date.now(),
   *   toApp: 'im.waiter',
   *   toPin: 'customer-456',
   * });
   * ```
   */
  static sendReceiveAck(
    wsManager: WebSocketManager,
    params: ReadAckParams,
  ): void {
    if (!wsManager.isConnected()) {
      console.warn(
        '[MessageAckHelper] WebSocket not connected, skipping receive ACK',
      );
      return;
    }

    try {
      wsManager.sendReceiveAck(params);
    } catch (error) {
      console.error('[MessageAckHelper] Failed to send receive ACK:', error);
      // 不抛出错误，避免影响消息处理流程
    }
  }
}
