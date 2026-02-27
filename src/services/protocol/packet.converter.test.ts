import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import {
  PacketMessageTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { PacketConverter } from '@/services/protocol/packet.converter';

describe('PacketConverter', () => {
  describe('toRawPacket', () => {
    it('应该将 StandardMessage 正确转换为 RawPacket', () => {
      const standardMessage = {
        id: 'msg-123',
        tempId: 'temp-456',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Sent,
        timestamp: 1234567890,
        type: MessageTypeEnum.Text,
        content: { text: 'Hello World' },
        sender: {
          pin: 'agent-123',
          app: 'fox_collect.waiter',
        },
        receiver: {
          pin: 'customer-456',
          app: 'im.waiter',
          channelType: ChannelTypeEnum.WhatsApp,
        },
      };

      const rawPacket = PacketConverter.toRawPacket(
        standardMessage,
        'fox_collect.waiter',
        'agent-123',
      );

      expect(rawPacket).toBeDefined();
      expect(rawPacket.id).toBe('msg-123');
      expect(rawPacket.mid).toBe('temp-456');
      expect(rawPacket.from.app).toBe('fox_collect.waiter');
      expect(rawPacket.from.pin).toBe('agent-123');
      expect(rawPacket.from.channelType).toBe('whatsapp');
      expect(rawPacket.to.app).toBe('im.waiter');
      expect(rawPacket.to.pin).toBe('customer-456');
      expect(rawPacket.ptype).toBe('chat_message');
      expect(rawPacket.timestamp).toBe(1234567890);
      expect(rawPacket.ver).toBe('1.0');
    });

    it('应该正确转换文本消息', () => {
      const message = {
        id: 'msg-123',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.SMS,
        status: MessageStatusEnum.Sent,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: 'Test message' },
        sender: {
          pin: 'agent-123',
          app: 'fox_collect.waiter',
        },
        receiver: {
          pin: 'customer-456',
          app: 'im.waiter',
          channelType: ChannelTypeEnum.SMS,
        },
      };

      const rawPacket = PacketConverter.toRawPacket(
        message,
        'fox_collect.waiter',
        'agent-123',
      );

      expect((rawPacket.body as { type: string }).type).toBe(
        MessageTypeEnum.Text,
      );
      expect((rawPacket.body as { content: unknown }).content).toEqual({
        text: 'Test message',
      });
    });
  });

  describe('toStandardMessage', () => {
    it('应该将 RawPacket 正确转换为 StandardMessage', () => {
      const rawPacket: RawPacket = {
        id: 'packet-123',
        mid: 'msg-456',
        from: {
          app: 'im.waiter',
          pin: 'customer-456',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        to: {
          app: 'fox_collect.waiter',
          pin: 'agent-123',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Hello from customer' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const standardMessage = PacketConverter.toStandardMessage(
        rawPacket,
        MessageDirectionEnum.Incoming,
        'agent-123',
      );

      expect(standardMessage).toBeDefined();
      expect(standardMessage.id).toBe('msg-456');
      expect(standardMessage.tempId).toBe('packet-123');
      expect(standardMessage.direction).toBe(MessageDirectionEnum.Incoming);
      expect(standardMessage.channelType).toBe(ChannelTypeEnum.WhatsApp);
      expect(standardMessage.status).toBe(MessageStatusEnum.Sent);
      expect(standardMessage.type).toBe(MessageTypeEnum.Text);
      expect(standardMessage.content).toEqual({ text: 'Hello from customer' });
      expect(standardMessage.sender?.pin).toBe('customer-456');
      expect(standardMessage.sender?.app).toBe('im.waiter');
      expect(standardMessage.receiver?.pin).toBe('agent-123');
      expect(standardMessage.receiver?.app).toBe('fox_collect.waiter');
    });

    it('应该自动判断消息方向', () => {
      const rawPacket: RawPacket = {
        id: 'packet-123',
        from: {
          app: 'fox_collect.waiter',
          pin: 'agent-123',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        to: {
          app: 'im.waiter',
          pin: 'customer-456',
          channelType: ChannelTypeEnum.WhatsApp,
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Test' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const message = PacketConverter.toStandardMessage(
        rawPacket,
        undefined,
        'agent-123',
      );

      expect(message.direction).toBe(MessageDirectionEnum.Outgoing);
    });

    it('应该正确解析文本消息', () => {
      const rawPacket: RawPacket = {
        id: 'packet-123',
        from: {
          app: 'im.waiter',
          pin: 'customer-456',
        },
        to: {
          app: 'fox_collect.waiter',
          pin: 'agent-123',
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Hello' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const message = PacketConverter.toStandardMessage(rawPacket);

      expect(message.type).toBe(MessageTypeEnum.Text);
      expect(message.content).toEqual({ text: 'Hello' });
    });

    it('应该正确解析图片消息', () => {
      const rawPacket: RawPacket = {
        id: 'packet-123',
        from: {
          app: 'im.waiter',
          pin: 'customer-456',
        },
        to: {
          app: 'fox_collect.waiter',
          pin: 'agent-123',
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Image,
          content: {
            url: 'https://example.com/image.jpg',
            mimeType: 'image/jpeg',
            size: 1024000,
          },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const message = PacketConverter.toStandardMessage(rawPacket);

      expect(message.type).toBe(MessageTypeEnum.Image);
      expect(message.content).toEqual({
        url: 'https://example.com/image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
      });
    });

    it('应该正确处理未知渠道类型', () => {
      const rawPacket: RawPacket = {
        id: 'packet-123',
        from: {
          app: 'im.waiter',
          pin: 'customer-456',
          channelType: 'unknown_channel' as ChannelTypeEnum,
        },
        to: {
          app: 'fox_collect.waiter',
          pin: 'agent-123',
        },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: MessageTypeEnum.Text,
          content: { text: 'Test' },
        },
        ver: '1.0',
        timestamp: Date.now(),
      };

      const message = PacketConverter.toStandardMessage(rawPacket);

      // 未知渠道应该默认为 SMS
      expect(message.channelType).toBe(ChannelTypeEnum.SMS);
    });
  });

  describe('双向转换', () => {
    it('应该保持数据一致性', () => {
      const originalMessage = {
        id: 'msg-123',
        tempId: 'temp-456',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Sent,
        timestamp: 1234567890,
        type: MessageTypeEnum.Text,
        content: { text: 'Test message' },
        sender: {
          pin: 'agent-123',
          app: 'fox_collect.waiter',
        },
        receiver: {
          pin: 'customer-456',
          app: 'im.waiter',
          channelType: ChannelTypeEnum.WhatsApp,
        },
      };

      // 转换为 RawPacket
      const rawPacket = PacketConverter.toRawPacket(
        originalMessage,
        'fox_collect.waiter',
        'agent-123',
      );

      // 转换回 StandardMessage
      const convertedMessage = PacketConverter.toStandardMessage(
        rawPacket,
        MessageDirectionEnum.Outgoing,
        'agent-123',
      );

      // 验证关键字段
      // 注意：在双向转换中，id 和 tempId 会互换
      // 原因：RawPacket.id 是客户端临时 ID，RawPacket.mid 是服务端 ID
      // 转换回 StandardMessage 时，id 使用 mid（服务端 ID），tempId 使用 id（临时 ID）
      expect(convertedMessage.id).toBe(originalMessage.tempId);
      expect(convertedMessage.tempId).toBe(originalMessage.id);
      expect(convertedMessage.direction).toBe(originalMessage.direction);
      expect(convertedMessage.channelType).toBe(originalMessage.channelType);
      expect(convertedMessage.type).toBe(originalMessage.type);
      expect(convertedMessage.content).toEqual(originalMessage.content);
    });
  });
});
