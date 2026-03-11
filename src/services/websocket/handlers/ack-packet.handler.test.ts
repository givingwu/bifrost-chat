import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  ClientTypeEnum,
  MessageStatusEnum,
  type MessageStatusUpdatedEvent,
} from '@/interfaces/message.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { messageQueue } from '@/services/message-queue.service';
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import { AckPacketHandler } from './ack-packet.handler';

function getStatusEventData(
  result: ReturnType<AckPacketHandler['handle']>,
): MessageStatusUpdatedEvent {
  return result.eventData?.data as MessageStatusUpdatedEvent;
}

describe('AckPacketHandler', () => {
  let handler: AckPacketHandler;

  beforeEach(() => {
    handler = new AckPacketHandler();
    // 清空映射表
    pendingMessageTracker.clear();
    messageQueue.clear();
  });

  afterEach(() => {
    pendingMessageTracker.clear();
    messageQueue.clear();
  });

  describe('canHandle', () => {
    it('应该处理 ptype 为 ack 的数据包', () => {
      expect(handler.canHandle(PacketMessageTypeEnum.Ack)).toBe(true);
    });

    it('应该处理 ptype 为 message_status_ack 的数据包', () => {
      expect(handler.canHandle(PacketMessageTypeEnum.MessageStatusAck)).toBe(
        true,
      );
    });

    it('不应该处理其他类型的 ptype', () => {
      expect(handler.canHandle(PacketMessageTypeEnum.ChatMessage)).toBe(false);
      expect(handler.canHandle(PacketMessageTypeEnum.ClientHeartbeat)).toBe(
        false,
      );
    });
  });

  describe('handle', () => {
    it('队列未命中时，chat_message ACK 应继续从映射表查找', () => {
      // 预先注册映射
      pendingMessageTracker.register('msg-123', 'conv-from-tracker');

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as unknown as string, // 模拟后端返回 null
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: PacketMessageTypeEnum.ChatMessage },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect(getStatusEventData(result).conversationId).toBe(
        'conv-from-tracker',
      );
    });

    it('当 chatId 和映射表都不存在时应该返回 null', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: PacketMessageTypeEnum.ChatMessage },
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

    it('fallback 路径处理完成后应该移除映射', () => {
      // 预先注册映射
      pendingMessageTracker.register('msg-123', 'conv-456');

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: PacketMessageTypeEnum.ChatMessage },
        ver: '1.0',
        timestamp: Date.now(),
      };

      handler.handle({ packet });

      // 映射应该被移除
      expect(pendingMessageTracker.has('msg-123')).toBe(false);
    });

    it('应优先使用队列将 msg_receive_ack 更新到原消息', () => {
      messageQueue.enqueueReceiptAck({
        ackRequestId: 'ack-123',
        conversationId: 'conv-456',
        targetMessageId: 'msg-origin-1',
        targetTempId: 'temp-origin-1',
        targetStatus: MessageStatusEnum.Delivered,
      });

      const packet: RawPacket = {
        id: 'ack-123',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: {
          app: 'test',
          pin: 'server',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReceiveAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).messageId).toBe('msg-origin-1');
      expect(getStatusEventData(result).tempId).toBe('temp-origin-1');
      expect(getStatusEventData(result).status).toBe(
        MessageStatusEnum.Delivered,
      );
    });

    it('应优先使用队列将 msg_read_ack 更新到原消息', () => {
      messageQueue.enqueueReceiptAck({
        ackRequestId: 'ack-read-1',
        conversationId: 'conv-456',
        targetMessageId: 'msg-origin-1',
        targetStatus: MessageStatusEnum.Read,
      });

      const packet: RawPacket = {
        id: 'ack-read-1',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: AckMessageTypeEnum.MsgReadAck },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Read);
    });

    it('队列未命中时，msg_receive_ack 不应错误更新 ACK 自身 id', () => {
      const packet: RawPacket = {
        id: 'ack-unknown-1',
        chatId: 'conv-456',
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
    });

    it('队列未命中时，应使用 body.status/body.id 处理新的状态回调', () => {
      const packet: RawPacket = {
        id: 'ack-status-1',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
          id: 'msg-origin-1',
          chatId: 'conv-456',
          status: 'DELIVER_FAIL',
          errorInfo: 'provider rejected',
        } as unknown as RawPacket['body'],
        ver: '1.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect(getStatusEventData(result).messageId).toBe('msg-origin-1');
      expect(getStatusEventData(result).conversationId).toBe('conv-456');
      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Failed);
      expect((result.eventData?.data as MessageStatusUpdatedEvent).error).toBe(
        'provider rejected',
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

      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Failed);
    });

    it('应将 body.type 为 chat_message 的服务端 ACK 映射为 sent', () => {
      pendingMessageTracker.register('chat-123', 'conv-456');

      const packet: RawPacket = {
        id: 'chat-123',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: '@im.kn.com' },
        to: {
          app: 'test',
          pin: 'user',
          channelType: ChannelTypeEnum.SMS,
          clientType: ClientTypeEnum.Web,
        },
        body: { type: PacketMessageTypeEnum.ChatMessage },
        ver: '1.0.0',
        timestamp: Date.now(),
      };

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).conversationId).toBe('conv-456');
      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Sent);
      expect(getStatusEventData(result).channelType).toBe(ChannelTypeEnum.SMS);
    });

    it('当 ACK 类型无效时应该返回 null', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => { });

      const packet: RawPacket = {
        id: 'msg-123',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.Ack,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: { type: 'invalid_type' as unknown as AckMessageTypeEnum },
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

    it('应处理 message_status_ack 类型并映射到正确消息状态（UN_READ → Delivered）', () => {
      const packet = {
        id: 'packet-wrapper-id',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          id: 'msg-real-123',
          chatId: 'conv-456',
          sender: 'agent-001',
          status: 'UN_READ',
          timestamp: Date.now(),
        },
        ver: '1.0',
        timestamp: Date.now(),
      } as unknown as RawPacket;

      const result = handler.handle({ packet });

      expect(result.eventData).not.toBeNull();
      expect(getStatusEventData(result).messageId).toBe('msg-real-123');
      expect(getStatusEventData(result).conversationId).toBe('conv-456');
      expect(getStatusEventData(result).status).toBe(
        MessageStatusEnum.Delivered,
      );
    });

    it('应处理 message_status_ack（READ → Read）', () => {
      const packet = {
        id: 'packet-wrapper-id',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          id: 'msg-read-1',
          chatId: 'conv-789',
          status: 'READ',
          timestamp: Date.now(),
        },
        ver: '1.0',
        timestamp: Date.now(),
      } as unknown as RawPacket;

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Read);
    });

    it('应处理 message_status_ack（SEND_FAIL + errorInfo → Failed + error）', () => {
      const packet = {
        id: 'packet-wrapper-id',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          id: 'msg-fail-1',
          chatId: 'conv-fail',
          status: 'SEND_FAIL',
          errorInfo: 'provider rejected',
          timestamp: Date.now(),
        },
        ver: '1.0',
        timestamp: Date.now(),
      } as unknown as RawPacket;

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Failed);
      expect((result.eventData?.data as MessageStatusUpdatedEvent).error).toBe(
        'provider rejected',
      );
    });

    it('应处理 message_status_ack（DELIVER_FAIL → Failed）', () => {
      const packet = {
        id: 'packet-wrapper-id',
        chatId: null as unknown as string,
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          id: 'msg-fail-2',
          chatId: 'conv-fail',
          status: 'DELIVER_FAIL',
          errorInfo: 'wa deliver customer fail',
          timestamp: Date.now(),
        },
        ver: '1.0',
        timestamp: Date.now(),
      } as unknown as RawPacket;

      const result = handler.handle({ packet });

      expect(getStatusEventData(result).status).toBe(MessageStatusEnum.Failed);
    });
  });
});
