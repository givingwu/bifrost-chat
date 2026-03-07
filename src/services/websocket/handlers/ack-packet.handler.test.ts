import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import { AckPacketHandler } from './ack-packet.handler';

describe('AckPacketHandler', () => {
  let handler: AckPacketHandler;

  beforeEach(() => {
    handler = new AckPacketHandler();
    // 清空映射表
    pendingMessageTracker.clear();
  });

  afterEach(() => {
    pendingMessageTracker.clear();
  });

  describe('canHandle', () => {
    it('应该处理 ptype 为 ack 的数据包', () => {
      expect(handler.canHandle(PacketMessageTypeEnum.Ack)).toBe(true);
    });

    it('不应该处理其他类型的 ptype', () => {
      expect(handler.canHandle(PacketMessageTypeEnum.ChatMessage)).toBe(false);
      expect(handler.canHandle(PacketMessageTypeEnum.ClientHeartbeat)).toBe(
        false,
      );
    });
  });

  describe('handle', () => {
    it('当 packet.chatId 存在时应该优先使用', () => {
      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect(result.eventData?.type).toBe(WebSocketEventTypeEnum.MessageStatus);
      expect((result.eventData?.data as any).conversationId).toBe('conv-456');
    });

    it('当 packet.chatId 为 null 时应该从映射表查找', () => {
      // 预先注册映射
      pendingMessageTracker.register('msg-123', 'conv-from-tracker');

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as any, // 模拟后端返回 null
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect((result.eventData?.data as any).conversationId).toBe(
        'conv-from-tracker',
      );
    });

    it('当 packet.chatId 为空字符串时应该从映射表查找', () => {
      // 预先注册映射
      pendingMessageTracker.register('msg-123', 'conv-from-tracker');

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: '',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect((result.eventData?.data as any).conversationId).toBe(
        'conv-from-tracker',
      );
    });

    it('当 chatId 和映射表都不存在时应该返回 null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as any,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).toBeNull();
      expect(result.shouldContinue).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AckPacketHandler] 无法确定 conversationId，跳过状态更新',
        expect.objectContaining({ messageId: 'msg-123' }),
      );

      consoleSpy.mockRestore();
    });

    it('处理完成后应该移除映射', () => {
      // 预先注册映射
      pendingMessageTracker.register('msg-123', 'conv-456');

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as any,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      handler.handle({ packet });

      // 映射应该被移除
      expect(pendingMessageTracker.has('msg-123')).toBe(false);
    });

    it('应该正确处理 msg_receive_ack 类型', () => {
      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect((result.eventData?.data as any).status).toBe(
        MessageStatusEnum.Delivered,
      );
    });

    it('应该正确处理 msg_read_ack 类型', () => {
      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReadAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect((result.eventData?.data as any).status).toBe(
        MessageStatusEnum.Read,
      );
    });

    it('应该正确处理 msg_send_failed 类型', () => {
      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgSendFailed },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect((result.eventData?.data as any).status).toBe(
        MessageStatusEnum.Failed,
      );
    });

    it('当 ACK 类型无效时应该返回 null', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: 'invalid_type' as any },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).toBeNull();
      expect(result.shouldContinue).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid ACK type:',
        'invalid_type',
      );

      consoleSpy.mockRestore();
    });
  });
});
