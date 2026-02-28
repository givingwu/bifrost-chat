/**
 * MessageAckHelper 单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadAckParams } from '@/interfaces/protocol.interface';
import { MessageAckHelper } from '@/services/message-ack-helper.service';
import type { WebSocketManager } from '@/services/websocket/websocket-manager.service';

describe('MessageAckHelper', () => {
  let mockWsManager: WebSocketManager;
  let mockSendReadAck: ReturnType<typeof vi.fn>;
  let mockSendReceiveAck: ReturnType<typeof vi.fn>;
  let mockIsConnected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock WebSocketManager
    mockSendReadAck = vi.fn();
    mockSendReceiveAck = vi.fn();
    mockIsConnected = vi.fn(() => true);

    mockWsManager = {
      sendReadAck: mockSendReadAck,
      sendReceiveAck: mockSendReceiveAck,
      isConnected: mockIsConnected,
    } as unknown as WebSocketManager;

    // 清除所有 mock 调用记录
    vi.clearAllMocks();
  });

  describe('sendReadAck', () => {
    it('应该发送已读 ACK', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      MessageAckHelper.sendReadAck(mockWsManager, params);

      expect(mockSendReadAck).toHaveBeenCalledWith(params);
      expect(mockSendReadAck).toHaveBeenCalledTimes(1);
    });

    it('WebSocket 未连接时应该跳过发送', () => {
      mockIsConnected.mockReturnValue(false);

      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      MessageAckHelper.sendReadAck(mockWsManager, params);

      expect(mockSendReadAck).not.toHaveBeenCalled();
    });

    it('发送失败时不应该抛出错误', () => {
      mockSendReadAck.mockImplementation(() => {
        throw new Error('Network error');
      });

      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      // 不应该抛出错误
      expect(() => {
        MessageAckHelper.sendReadAck(mockWsManager, params);
      }).not.toThrow();
    });
  });

  describe('sendReadAckBatch', () => {
    it('应该批量发送已读 ACK', () => {
      const paramsList: ReadAckParams[] = [
        {
          sender: 'agent-123',
          app: 'fox_collect.waiter',
          mid: 'msg-1',
          chatId: 'conv-123',
          datetime: 1234567890000,
        },
        {
          sender: 'agent-123',
          app: 'fox_collect.waiter',
          mid: 'msg-2',
          chatId: 'conv-123',
          datetime: 1234567890000,
        },
      ];

      MessageAckHelper.sendReadAckBatch(mockWsManager, paramsList);

      expect(mockSendReadAck).toHaveBeenCalledTimes(2);
      expect(mockSendReadAck).toHaveBeenCalledWith(paramsList[0]);
      expect(mockSendReadAck).toHaveBeenCalledWith(paramsList[1]);
    });

    it('WebSocket 未连接时应该跳过批量发送', () => {
      mockIsConnected.mockReturnValue(false);

      const paramsList: ReadAckParams[] = [
        {
          sender: 'agent-123',
          app: 'fox_collect.waiter',
          mid: 'msg-1',
          chatId: 'conv-123',
          datetime: 1234567890000,
        },
      ];

      MessageAckHelper.sendReadAckBatch(mockWsManager, paramsList);

      expect(mockSendReadAck).not.toHaveBeenCalled();
    });

    it('部分发送失败时应该继续发送其他 ACK', () => {
      mockSendReadAck
        .mockImplementationOnce(() => {
          throw new Error('Network error');
        })
        .mockImplementationOnce(() => {
          // 第二次调用成功
        });

      const paramsList: ReadAckParams[] = [
        {
          sender: 'agent-123',
          app: 'fox_collect.waiter',
          mid: 'msg-1',
          chatId: 'conv-123',
          datetime: 1234567890000,
        },
        {
          sender: 'agent-123',
          app: 'fox_collect.waiter',
          mid: 'msg-2',
          chatId: 'conv-123',
          datetime: 1234567890000,
        },
      ];

      // 不应该抛出错误
      expect(() => {
        MessageAckHelper.sendReadAckBatch(mockWsManager, paramsList);
      }).not.toThrow();

      // 第二个 ACK 应该被发送
      expect(mockSendReadAck).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendReceiveAck', () => {
    it('应该发送接收 ACK', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      MessageAckHelper.sendReceiveAck(mockWsManager, params);

      expect(mockSendReceiveAck).toHaveBeenCalledWith(params);
      expect(mockSendReceiveAck).toHaveBeenCalledTimes(1);
    });

    it('WebSocket 未连接时应该跳过发送', () => {
      mockIsConnected.mockReturnValue(false);

      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      MessageAckHelper.sendReceiveAck(mockWsManager, params);

      expect(mockSendReceiveAck).not.toHaveBeenCalled();
    });

    it('发送失败时不应该抛出错误', () => {
      mockSendReceiveAck.mockImplementation(() => {
        throw new Error('Network error');
      });

      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-123',
        datetime: 1234567890000,
      };

      // 不应该抛出错误
      expect(() => {
        MessageAckHelper.sendReceiveAck(mockWsManager, params);
      }).not.toThrow();
    });
  });
});
