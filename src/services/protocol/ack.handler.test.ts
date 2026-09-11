import { describe, expect, it } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  AckMessageTypeEnum,
  type AckPacketBody,
  PacketMessageTypeEnum,
  PacketSenderTypeEnum,
} from '@/interfaces/protocol.interface';
import { AckHandler } from '@/services/protocol/ack.handler';

describe('AckHandler', () => {
  describe('createReadAck', () => {
    it('应该创建正确的已读 ACK 消息', () => {
      const params: AckPacketBody = {
        sender: 'customer-001',
        app: 'example_chat.customer',
        mid: 'msg-456',
        chatId: 'conv-789',
        timestamp: 1234567890,
      };

      const ackPacket = AckHandler.createReadAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );

      expect(ackPacket).toBeDefined();
      // ✅ 修改：应该使用 msg_read_ack 而不是 ack
      expect(ackPacket.ptype).toBe(AckMessageTypeEnum.MsgReadAck);
      expect(ackPacket.from.app).toBe('example_chat.waiter');
      expect(ackPacket.from.pin).toBe('agent-123');
      // to 字段使用 from 的值
      expect(ackPacket.to.app).toBe('');
      expect(ackPacket.to.pin).toBe('');
      // body 表示被 ACK 的原消息标识（含原消息发送方）
      expect(ackPacket.body.sender).toBe('customer-001');
      expect(ackPacket.body.app).toBe('example_chat.customer');
      expect(ackPacket.body.mid).toBe('msg-456');
      expect(ackPacket.body.chatId).toBe('conv-789');
      expect(ackPacket.body.timestamp).toBe(1234567890);
      expect(ackPacket.ver).toBe('1.0');
      expect(ackPacket.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
    });

    it('应该生成唯一的 ACK ID', () => {
      const params: AckPacketBody = {
        sender: 'customer-001',
        app: 'example_chat.customer',
        mid: 'msg-456',
        chatId: 'conv-789',
        timestamp: Date.now(),
      };

      const ack1 = AckHandler.createReadAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );
      const ack2 = AckHandler.createReadAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );

      expect(ack1.id).not.toBe(ack2.id);
    });

    it('应该支持自定义 requestId', () => {
      const ackPacket = AckHandler.createReadAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        {
          sender: 'customer-001',
          app: 'example_chat.customer',
          mid: 'msg-456',
          chatId: 'conv-789',
          timestamp: 1234567890,
        },
        {
          requestId: 'read-ack-custom-id',
        },
      );

      expect(ackPacket.id).toBe('read-ack-custom-id');
    });
  });

  describe('createReceiveAck', () => {
    it('应该创建正确的收到消息 ACK', () => {
      const params: AckPacketBody = {
        sender: 'customer-001',
        app: 'example_chat.customer',
        mid: 'msg-456',
        chatId: 'conv-789',
        timestamp: 1234567890,
      };

      const ackPacket = AckHandler.createReceiveAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );

      expect(ackPacket).toBeDefined();
      // ✅ 应该使用 msg_receive_ack
      expect(ackPacket.ptype).toBe(AckMessageTypeEnum.MsgReceiveAck);
      expect(ackPacket.from.app).toBe('example_chat.waiter');
      expect(ackPacket.from.pin).toBe('agent-123');
      // to 字段使用 from 的值
      expect(ackPacket.to.app).toBe('');
      expect(ackPacket.to.pin).toBe('');
      // body 表示被 ACK 的原消息标识（含原消息发送方）
      expect(ackPacket.body.sender).toBe('customer-001');
      expect(ackPacket.body.app).toBe('example_chat.customer');
      expect(ackPacket.body.mid).toBe('msg-456');
      expect(ackPacket.body.chatId).toBe('conv-789');
      expect(ackPacket.body.timestamp).toBe(1234567890);
      expect(ackPacket.ver).toBe('1.0');
      expect(ackPacket.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
    });

    it('应该生成唯一的收到 ACK ID', () => {
      const params: AckPacketBody = {
        sender: 'customer-001',
        app: 'example_chat.customer',
        mid: 'msg-456',
        chatId: 'conv-789',
        timestamp: Date.now(),
      };

      const ack1 = AckHandler.createReceiveAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );
      const ack2 = AckHandler.createReceiveAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        params,
      );

      expect(ack1.id).not.toBe(ack2.id);
    });

    it('应该支持自定义 requestId', () => {
      const ackPacket = AckHandler.createReceiveAck(
        {
          app: 'example_chat.waiter',
          pin: 'agent-123',
        },
        {
          sender: 'customer-001',
          app: 'example_chat.customer',
          mid: 'msg-456',
          chatId: 'conv-789',
          timestamp: 1234567890,
        },
        {
          requestId: 'receive-ack-custom-id',
        },
      );

      expect(ackPacket.id).toBe('receive-ack-custom-id');
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

    it('应该解析携带 body.status 的状态回调 ACK', () => {
      const data = {
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
          id: 'msg-123',
          chatId: 'conv-456',
          status: 'DELIVER_FAIL',
          errorInfo: 'channel callback failed',
          timestamp: 1234567890,
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData).toBeDefined();
      expect(ackData?.id).toBe('msg-123');
      expect(ackData?.body.id).toBe('msg-123');
      expect(ackData?.body.chatId).toBe('conv-456');
      expect(ackData?.body.status).toBe('DELIVER_FAIL');
      expect(ackData?.body.errorInfo).toBe('channel callback failed');
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
      expect(
        AckHandler.parseDownstream({
          id: 'ack-123',
          ptype: PacketMessageTypeEnum.Ack,
          body: '',
        }),
      ).toBeNull();
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

    it('应该正确解析 message_status_ack 格式', () => {
      const data = {
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        body: {
          id: 'msg-real-123',
          chatId: 'conv-456',
          sender: 'agent-001',
          status: 'UN_READ',
          timestamp: 1769063279192,
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData).not.toBeNull();
      expect(ackData?.id).toBe('msg-real-123');
      expect(ackData?.ptype).toBe(PacketMessageTypeEnum.MessageStatusAck);
      expect(ackData?.body.type).toBe(PacketMessageTypeEnum.MessageStatusAck);
      expect(ackData?.body.id).toBe('msg-real-123');
      expect(ackData?.body.chatId).toBe('conv-456');
      expect(ackData?.body.sender).toBe('agent-001');
      expect(ackData?.body.status).toBe('UN_READ');
      expect(ackData?.timestamp).toBe(1769063279192);
    });

    it('message_status_ack 应透过 packet.id 使用 body.id 作为消息 ID', () => {
      const data = {
        id: 'packet-wrapper-id', // 包装层 id，不是真实消息 id
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        body: {
          id: 'real-msg-id',
          chatId: 'conv-456',
          status: 'READ',
          timestamp: 1769063279192,
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      // 应使用 body.id，而不是 packet.id
      expect(ackData?.id).toBe('real-msg-id');
    });

    it('message_status_ack 缺少 body.id 时应返回 null', () => {
      const data = {
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        body: {
          chatId: 'conv-456',
          status: 'READ',
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData).toBeNull();
    });

    it('message_status_ack 应包含 errorInfo 字段', () => {
      const data = {
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        body: {
          id: 'msg-fail-1',
          chatId: 'conv-456',
          status: 'SEND_FAIL',
          errorInfo: 'provider rejected',
          timestamp: 1769063279192,
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData?.body.status).toBe('SEND_FAIL');
      expect(ackData?.body.errorInfo).toBe('provider rejected');
    });

    it('message_status_ack 应解析 packet 顶层 senderType 和 channelAccount', () => {
      const data = {
        ptype: PacketMessageTypeEnum.MessageStatusAck,
        channelAccount: 'whatsapp-account-001',
        senderType: 1,
        body: {
          id: 'msg-real-robot',
          chatId: 'conv-robot',
          status: 'un_send',
          timestamp: 1769063279192,
        },
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData?.channelAccount).toBe('whatsapp-account-001');
      expect(ackData?.senderType).toBe(PacketSenderTypeEnum.Chatbot);
    });

    it('普通 ACK 应解析 packet 顶层 senderType 和 channelAccount', () => {
      const data = {
        id: 'msg-ack-robot',
        ptype: PacketMessageTypeEnum.Ack,
        channelAccount: 'whatsapp-account-002',
        senderType: '1',
        body: {
          type: PacketMessageTypeEnum.ChatMessage,
        },
        timestamp: 1769063279192,
      };

      const ackData = AckHandler.parseDownstream(data);

      expect(ackData?.channelAccount).toBe('whatsapp-account-002');
      expect(ackData?.senderType).toBe(PacketSenderTypeEnum.Chatbot);
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
      expect(
        AckHandler.isValidAckType(PacketMessageTypeEnum.MessageStatusAck),
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
      // message_status_ack 状态由 body.status 决定，这里返回 Sent 作为占位符
      expect(
        AckHandler.ackTypeToMessageStatus(
          PacketMessageTypeEnum.MessageStatusAck,
        ),
      ).toBe(MessageStatusEnum.Sent);
    });

    it('应该处理未知的 ACK 类型', () => {
      expect(AckHandler.ackTypeToMessageStatus('unknown_type')).toBe(
        MessageStatusEnum.Sent,
      );
    });
  });

  describe('ackDataToMessageStatus', () => {
    it('应优先使用 body.status 解析状态回调', () => {
      const ackData = AckHandler.parseDownstream({
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
          id: 'msg-123',
          status: 'UN_READ',
        },
      });

      expect(ackData).toBeDefined();
      expect(
        AckHandler.ackDataToMessageStatus(
          ackData as NonNullable<typeof ackData>,
        ),
      ).toBe(MessageStatusEnum.Delivered);
    });

    it('应将点击状态回调解析为 Clicked', () => {
      const ackData = AckHandler.parseDownstream({
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
          id: 'msg-123',
          status: 'CLICK',
        },
      });

      expect(ackData).toBeDefined();
      expect(
        AckHandler.ackDataToMessageStatus(
          ackData as NonNullable<typeof ackData>,
        ),
      ).toBe(MessageStatusEnum.Clicked);
    });

    it('当 body.status 非法时应返回 undefined，而不是回退为已读', () => {
      const ackData = AckHandler.parseDownstream({
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: AckMessageTypeEnum.MsgReadAck,
          id: 'msg-123',
          status: 'INVALID_STATUS',
        },
      });

      expect(ackData).toBeDefined();
      expect(
        AckHandler.ackDataToMessageStatus(
          ackData as NonNullable<typeof ackData>,
        ),
      ).toBeUndefined();
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
