import { describe, expect, it } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
  type ReadAckParams,
} from '@/interfaces/protocol.interface';
import { AckHandler } from '@/services/protocol/ack.handler';

describe('AckHandler', () => {
  describe('createReadAck', () => {
    it('应该创建正确的已读 ACK 消息', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-789',
        datetime: 1234567890,
        toApp: 'im.waiter',
        toPin: 'customer-456',
      };

      const ackPacket = AckHandler.createReadAck(params);

      expect(ackPacket).toBeDefined();
      // ✅ 修改：应该使用 msg_read_ack 而不是 ack
      expect(ackPacket.ptype).toBe(AckMessageTypeEnum.MsgReadAck);
      expect(ackPacket.from.app).toBe('fox_collect.waiter');
      expect(ackPacket.from.pin).toBe('agent-123');
      expect(ackPacket.to.app).toBe('im.waiter');
      expect(ackPacket.to.pin).toBe('customer-456');
      expect(ackPacket.body.sender).toBe('agent-123');
      expect(ackPacket.body.app).toBe('fox_collect.waiter');
      expect(ackPacket.body.mid).toBe('msg-456');
      expect(ackPacket.body.chatId).toBe('conv-789');
      expect(ackPacket.body.datetime).toBe(1234567890);
      expect(ackPacket.ver).toBe('1.0');
      expect(ackPacket.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
    });

    it('应该生成唯一的 ACK ID', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-789',
        datetime: Date.now(),
        toApp: 'im.waiter',
        toPin: 'customer-456',
      };

      const ack1 = AckHandler.createReadAck(params);
      const ack2 = AckHandler.createReadAck(params);

      expect(ack1.id).not.toBe(ack2.id);
    });
  });

  describe('createReceiveAck', () => {
    it('应该创建正确的收到消息 ACK', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-789',
        datetime: 1234567890,
        toApp: 'im.waiter',
        toPin: 'customer-456',
      };

      const ackPacket = AckHandler.createReceiveAck(params);

      expect(ackPacket).toBeDefined();
      // ✅ 应该使用 msg_receive_ack
      expect(ackPacket.ptype).toBe(AckMessageTypeEnum.MsgReceiveAck);
      expect(ackPacket.from.app).toBe('fox_collect.waiter');
      expect(ackPacket.from.pin).toBe('agent-123');
      expect(ackPacket.to.app).toBe('im.waiter');
      expect(ackPacket.to.pin).toBe('customer-456');
      expect(ackPacket.body.sender).toBe('agent-123');
      expect(ackPacket.body.app).toBe('fox_collect.waiter');
      expect(ackPacket.body.mid).toBe('msg-456');
      expect(ackPacket.body.chatId).toBe('conv-789');
      expect(ackPacket.body.datetime).toBe(1234567890);
      expect(ackPacket.ver).toBe('1.0');
      expect(ackPacket.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
    });

    it('应该生成唯一的收到 ACK ID', () => {
      const params: ReadAckParams = {
        sender: 'agent-123',
        app: 'fox_collect.waiter',
        mid: 'msg-456',
        chatId: 'conv-789',
        datetime: Date.now(),
        toApp: 'im.waiter',
        toPin: 'customer-456',
      };

      const ack1 = AckHandler.createReceiveAck(params);
      const ack2 = AckHandler.createReceiveAck(params);

      expect(ack1.id).not.toBe(ack2.id);
    });
  });

  describe('parseDownstream', () => {
    it('应该正确解析有效的 ACK 消息', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
        },
        timestamp: 1234567890,
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData).toBeDefined();
      expect(ackData?.id).toBe('ack-123');
      expect(ackData?.body.type).toBe(AckMessageTypeEnum.MsgReadAck);
      expect(ackData?.timestamp).toBe(1234567890);
    });

    it('应该拒绝非 ACK 类型的消息', () => {
      const data = {
        id: 'msg-123',
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: 'text',
          content: { text: 'Hello' },
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData).toBeNull();
    });

    it('应该拒绝无效的数据', () => {
      expect(AckHandler.parseDownstream(null)).toBeNull();
      expect(AckHandler.parseDownstream(undefined)).toBeNull();
      expect(AckHandler.parseDownstream('')).toBeNull();
      expect(AckHandler.parseDownstream({})).toBeNull();
    });

    it('应该拒绝缺少必要字段的 ACK', () => {
      // 缺少 id
      expect(
        AckHandler.parseDownstream({
          ptype: PacketMessageTypeEnum.Ack,
          body: { type: AckMessageTypeEnum.MsgReadAck },
        }),
      ).toBeNull();

      // 缺少 body
      expect(
        AckHandler.parseDownstream({
          id: 'ack-123',
          ptype: PacketMessageTypeEnum.Ack,
        }),
      ).toBeNull();

      // body 缺少 type
      expect(
        AckHandler.parseDownstream({
          id: 'ack-123',
          type: PacketMessageTypeEnum.Ack,
          body: {},
        }),
      ).toBeNull();
    });
  });

  describe('isValidAckType', () => {
    it('应该识别有效的 ACK 类型', () => {
      expect(AckHandler.isValidAckType(AckMessageTypeEnum.MsgReceiveAck)).toBe(
        true,
      );
      expect(AckHandler.isValidAckType(AckMessageTypeEnum.MsgReadAck)).toBe(
        true,
      );
      expect(AckHandler.isValidAckType(AckMessageTypeEnum.MsgSendFailed)).toBe(
        true,
      );
      expect(
        AckHandler.isValidAckType(PacketMessageTypeEnum.ClientHeartbeat),
      ).toBe(true);
    });

    it('应该拒绝无效的 ACK 类型', () => {
      expect(AckHandler.isValidAckType('invalid_type')).toBe(false);
      expect(AckHandler.isValidAckType('')).toBe(false);
    });
  });

  describe('ackTypeToMessageStatus', () => {
    it('应该正确映射 ACK 类型到消息状态', () => {
      expect(
        AckHandler.ackTypeToMessageStatus(AckMessageTypeEnum.MsgReceiveAck),
      ).toBe(MessageStatusEnum.Delivered);
      expect(
        AckHandler.ackTypeToMessageStatus(AckMessageTypeEnum.MsgReadAck),
      ).toBe(MessageStatusEnum.Read);
      expect(
        AckHandler.ackTypeToMessageStatus(AckMessageTypeEnum.MsgSendFailed),
      ).toBe(MessageStatusEnum.Failed);
      expect(
        AckHandler.ackTypeToMessageStatus(
          PacketMessageTypeEnum.ClientHeartbeat,
        ),
      ).toBe(MessageStatusEnum.Sent);
    });

    it('应该处理未知的 ACK 类型', () => {
      expect(AckHandler.ackTypeToMessageStatus('unknown_type')).toBe(
        MessageStatusEnum.Sent,
      );
    });
  });

  describe('isHeartbeatAck', () => {
    it('应该识别心跳 ACK', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: PacketMessageTypeEnum.ClientHeartbeat,
        },
      };

      expect(AckHandler.isHeartbeatAck(data)).toBe(true);
    });

    it('应该拒绝非心跳 ACK', () => {
      const data = {
        id: 'ack-123',
        type: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
        },
      };

      expect(AckHandler.isHeartbeatAck(data)).toBe(false);
    });
  });

  describe('isSendFailedAck', () => {
    it('应该识别发送失败 ACK', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgSendFailed,
        },
      };

      expect(AckHandler.isSendFailedAck(data)).toBe(true);
    });
  });

  describe('isReadAck', () => {
    it('应该识别已读 ACK', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
        },
      };

      expect(AckHandler.isReadAck(data)).toBe(true);
    });
  });

  describe('isReceiveAck', () => {
    it('应该识别已接收 ACK', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReceiveAck,
        },
      };

      expect(AckHandler.isReceiveAck(data)).toBe(true);
    });
  });
});
