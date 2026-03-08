import { describe, expect, it } from 'vitest';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import { HeartbeatManager } from '@/services/protocol/heartbeat.manager';

describe('HeartbeatManager', () => {
  describe('createHeartbeat', () => {
    it('应该创建正确的心跳消息', () => {
      const heartbeat = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });

      expect(heartbeat).toBeDefined();
      expect(heartbeat.ptype).toBe('client_heartbeat');
      expect(heartbeat.body).toEqual({});
      expect(heartbeat.ver).toBe('1.0');
      expect(heartbeat.timestamp).toBeGreaterThan(0);
      expect(heartbeat.id).toMatch(
        /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i,
      );
      expect(heartbeat.from.app).toBe('fox_collect.waiter');
      expect(heartbeat.from.pin).toBe('agent-123');
      expect(heartbeat.to.app).toBe('im.waiter');
      expect(heartbeat.to.pin).toBe('customer-456');
    });

    it('应该生成唯一的心跳 ID', () => {
      const heartbeat1 = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });
      const heartbeat2 = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });

      expect(heartbeat1.id).not.toBe(heartbeat2.id);
    });

    it('应该使用当前时间戳', () => {
      const beforeTime = Date.now();
      const heartbeat = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });
      const afterTime = Date.now();

      expect(heartbeat.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(heartbeat.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('isHeartbeatResponse', () => {
    it('应该识别心跳响应', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: PacketMessageTypeEnum.ClientHeartbeat,
        },
      };

      expect(HeartbeatManager.isHeartbeatResponse(data)).toBe(true);
    });

    it('应该拒绝非心跳响应', () => {
      const data = {
        id: 'ack-123',
        ptype: PacketMessageTypeEnum.Ack,
        body: {
          type: 'msg_read_ack',
        },
      };

      expect(HeartbeatManager.isHeartbeatResponse(data)).toBe(false);
    });

    it('应该拒绝无效的数据', () => {
      expect(HeartbeatManager.isHeartbeatResponse(null)).toBe(false);
      expect(HeartbeatManager.isHeartbeatResponse(undefined)).toBe(false);
      expect(HeartbeatManager.isHeartbeatResponse('')).toBe(false);
      expect(HeartbeatManager.isHeartbeatResponse({})).toBe(false);
      expect(
        HeartbeatManager.isHeartbeatResponse({
          id: 'ack-123',
          ptype: PacketMessageTypeEnum.Ack,
          body: '',
        }),
      ).toBe(false);
    });

    it('应该拒绝非 ACK 类型的消息', () => {
      const data = {
        id: 'msg-123',
        type: PacketMessageTypeEnum.ChatMessage,
        body: {
          type: 'text',
          content: { text: 'Hello' },
        },
      };

      expect(HeartbeatManager.isHeartbeatResponse(data)).toBe(false);
    });
  });

  describe('createHeartbeatAck', () => {
    it('应该创建心跳 ACK 响应', () => {
      const originalHeartbeat = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });

      const ack = HeartbeatManager.createHeartbeatAck(originalHeartbeat);

      expect(ack).toBeDefined();
      expect(ack.id).toBe(originalHeartbeat.id);
      expect(ack.ptype).toBe(PacketMessageTypeEnum.Ack);
      expect((ack.body as { type: string }).type).toBe(
        PacketMessageTypeEnum.ClientHeartbeat,
      );
      expect(ack.from.app).toBe(originalHeartbeat.to.app);
      expect(ack.from.pin).toBe(originalHeartbeat.to.pin);
      expect(ack.to.app).toBe(originalHeartbeat.from.app);
      expect(ack.to.pin).toBe(originalHeartbeat.from.pin);
    });
  });

  describe('isValidHeartbeat', () => {
    it('应该识别有效的心跳消息', () => {
      const heartbeat = HeartbeatManager.createHeartbeat({
        fromApp: 'fox_collect.waiter',
        fromPin: 'agent-123',
        toApp: 'im.waiter',
        toPin: 'customer-456',
      });

      expect(HeartbeatManager.isValidHeartbeat(heartbeat)).toBe(true);
    });

    it('应该拒绝无效的心跳消息', () => {
      // 缺少 ptype
      expect(
        HeartbeatManager.isValidHeartbeat({
          id: 'heartbeat-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        }),
      ).toBe(false);

      // 缺少 id
      expect(
        HeartbeatManager.isValidHeartbeat({
          ptype: 'client_heartbeat',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        }),
      ).toBe(false);

      // 缺少 from
      expect(
        HeartbeatManager.isValidHeartbeat({
          id: 'heartbeat-123',
          ptype: 'client_heartbeat',
          to: { app: 'test', pin: '456' },
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        }),
      ).toBe(false);

      // 缺少 to
      expect(
        HeartbeatManager.isValidHeartbeat({
          id: 'heartbeat-123',
          ptype: 'client_heartbeat',
          from: { app: 'test', pin: '123' },
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        }),
      ).toBe(false);

      // body 不为空
      expect(
        HeartbeatManager.isValidHeartbeat({
          id: 'heartbeat-123',
          ptype: 'client_heartbeat',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          body: { extra: 'field' },
          ver: '1.0',
          timestamp: Date.now(),
        }),
      ).toBe(false);
    });

    it('应该拒绝无效的数据类型', () => {
      expect(HeartbeatManager.isValidHeartbeat(null)).toBe(false);
      expect(HeartbeatManager.isValidHeartbeat(undefined)).toBe(false);
      expect(HeartbeatManager.isValidHeartbeat('')).toBe(false);
      expect(HeartbeatManager.isValidHeartbeat(123)).toBe(false);
    });
  });
});
