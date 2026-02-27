import { describe, expect, it } from 'vitest';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import { PacketValidator } from '@/services/protocol/packet.validator';

describe('PacketValidator', () => {
  describe('hasValidPtype', () => {
    it('应该识别有效的 ptype 值', () => {
      const validPackets = [
        { ptype: PacketMessageTypeEnum.Auth },
        { ptype: PacketMessageTypeEnum.AuthFail },
        { ptype: PacketMessageTypeEnum.ChatMessage },
        { ptype: PacketMessageTypeEnum.Ack },
        { ptype: PacketMessageTypeEnum.ClientHeartbeat },
        { ptype: PacketMessageTypeEnum.StatusSwitch },
        { ptype: PacketMessageTypeEnum.FoxMessageAck },
      ];

      validPackets.forEach((packet) => {
        expect(PacketValidator.hasValidPtype(packet as never)).toBe(true);
      });
    });

    it('应该拒绝无效的 ptype 值', () => {
      const invalidPackets = [
        { ptype: 'invalid_type' },
        { ptype: 'CHAT_MESSAGE' }, // 大写
        { ptype: 'chat' }, // 不完整
        { ptype: '' }, // 空字符串
      ];

      invalidPackets.forEach((packet) => {
        expect(PacketValidator.hasValidPtype(packet as never)).toBe(false);
      });
    });

    it('应该拒绝缺少 ptype 字段的数据', () => {
      const packets = [
        { type: 'chat_message' }, // 使用了 type 而不是 ptype
        { id: '123' }, // 缺少 ptype
        {}, // 空对象
      ];

      packets.forEach((packet) => {
        expect(PacketValidator.hasValidPtype(packet as never)).toBe(false);
      });
    });

    it('应该拒绝非对象类型的数据', () => {
      expect(PacketValidator.hasValidPtype(null as never)).toBe(false);
      expect(PacketValidator.hasValidPtype(undefined as never)).toBe(false);
      expect(PacketValidator.hasValidPtype('string' as never)).toBe(false);
      expect(PacketValidator.hasValidPtype(123 as never)).toBe(false);
      expect(PacketValidator.hasValidPtype(true as never)).toBe(false);
    });

    it('应该处理 ptype 为非字符串的情况', () => {
      const packets = [
        { ptype: 123 },
        { ptype: null },
        { ptype: undefined },
        { ptype: {} },
      ];

      packets.forEach((packet) => {
        expect(PacketValidator.hasValidPtype(packet as never)).toBe(false);
      });
    });
  });

  describe('ensurePType', () => {
    it('应该通过有效的数据包验证', () => {
      const validPackets = [
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        },
        {
          id: 'ack-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.Ack,
          body: { type: 'msg_read_ack' },
          ver: '1.0',
          timestamp: Date.now(),
        },
      ];

      validPackets.forEach((packet) => {
        expect(() => PacketValidator.ensurePType(packet)).not.toThrow();
      });
    });

    it('应该为缺少 ptype 字段的数据包抛出错误', () => {
      const invalidPackets = [
        { type: 'chat_message' }, // 使用了 type 而不是 ptype
        { id: '123' }, // 缺少 ptype
        {}, // 空对象
      ];

      invalidPackets.forEach((packet) => {
        expect(() => PacketValidator.ensurePType(packet)).toThrow(
          'ptype field is required and must be a string',
        );
      });
    });

    it('应该为无效的 ptype 值抛出错误', () => {
      const invalidPackets = [
        { ptype: 'invalid_type' },
        { ptype: 'CHAT_MESSAGE' }, // 大写
        { ptype: '' }, // 空字符串
      ];

      invalidPackets.forEach((packet) => {
        expect(() => PacketValidator.ensurePType(packet)).toThrow(
          'ptype value',
        );
      });
    });

    it('应该为非对象类型的数据抛出错误', () => {
      const invalidData = [null, undefined, 'string', 123, true];

      invalidData.forEach((data) => {
        expect(() => PacketValidator.ensurePType(data)).toThrow(
          'data must be an object with ptype field',
        );
      });
    });

    it('应该提供有用的错误信息', () => {
      const packet = { ptype: 'invalid_type' };

      try {
        PacketValidator.ensurePType(packet);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('ptype value');
        expect((error as Error).message).toContain('invalid_type');
      }
    });
  });

  describe('isValidRawPacket', () => {
    it('应该识别有效的 RawPacket', () => {
      const validPacket = {
        id: 'msg-123',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: { type: 'text', content: { text: 'Hello' } },
        ver: '1.0',
        timestamp: Date.now(),
      };

      expect(PacketValidator.isValidRawPacket(validPacket)).toBe(true);
    });

    it('应该拒绝缺少必填字段的数据包', () => {
      const invalidPackets = [
        {}, // 空对象
        { id: 'msg-123' }, // 只有 id
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          // 缺少 ptype
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        },
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          // 缺少 body
          ver: '1.0',
          timestamp: Date.now(),
        },
      ];

      invalidPackets.forEach((packet) => {
        expect(PacketValidator.isValidRawPacket(packet)).toBe(false);
      });
    });

    it('应该拒绝无效的 ptype 值', () => {
      const invalidPacket = {
        id: 'msg-123',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: 'invalid_type',
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
      };

      expect(PacketValidator.isValidRawPacket(invalidPacket)).toBe(false);
    });

    it('应该拒绝字段类型错误的数据包', () => {
      const invalidPackets = [
        {
          id: 123, // 应该是字符串
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        },
        {
          id: 'msg-123',
          from: 'test', // 应该是对象
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: {},
          ver: '1.0',
          timestamp: Date.now(),
        },
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: 'text', // 应该是对象
          ver: '1.0',
          timestamp: Date.now(),
        },
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: {},
          ver: 1.0, // 应该是字符串
          timestamp: Date.now(),
        },
        {
          id: 'msg-123',
          from: { app: 'test', pin: '123' },
          to: { app: 'test', pin: '456' },
          ptype: PacketMessageTypeEnum.ChatMessage,
          body: {},
          ver: '1.0',
          timestamp: '1234567890', // 应该是数字
        },
      ];

      invalidPackets.forEach((packet) => {
        expect(PacketValidator.isValidRawPacket(packet)).toBe(false);
      });
    });

    it('应该拒绝非对象类型的数据', () => {
      expect(PacketValidator.isValidRawPacket(null)).toBe(false);
      expect(PacketValidator.isValidRawPacket(undefined)).toBe(false);
      expect(PacketValidator.isValidRawPacket('string')).toBe(false);
      expect(PacketValidator.isValidRawPacket(123)).toBe(false);
    });
  });

  describe('getPType', () => {
    it('应该返回有效的 ptype 值', () => {
      const packets = [
        { ptype: PacketMessageTypeEnum.ChatMessage },
        { ptype: PacketMessageTypeEnum.Ack },
        { ptype: PacketMessageTypeEnum.ClientHeartbeat },
      ];

      packets.forEach((packet) => {
        expect(PacketValidator.getPType(packet)).toBe(packet.ptype);
      });
    });

    it('应该为缺少 ptype 字段的数据返回 undefined', () => {
      const packets = [
        { type: 'chat_message' }, // 使用了 type 而不是 ptype
        { id: '123' }, // 缺少 ptype
        {}, // 空对象
      ];

      packets.forEach((packet) => {
        expect(PacketValidator.getPType(packet)).toBeUndefined();
      });
    });

    it('应该为非对象类型的数据返回 undefined', () => {
      expect(PacketValidator.getPType(null)).toBeUndefined();
      expect(PacketValidator.getPType(undefined)).toBeUndefined();
      expect(PacketValidator.getPType('string')).toBeUndefined();
      expect(PacketValidator.getPType(123)).toBeUndefined();
    });

    it('应该处理 ptype 为非字符串的情况', () => {
      const packets = [{ ptype: 123 }, { ptype: null }, { ptype: undefined }];

      packets.forEach((packet) => {
        expect(PacketValidator.getPType(packet)).toBeUndefined();
      });
    });
  });

  describe('类型守卫', () => {
    it('ensurePType 应该作为类型守卫', () => {
      const data: unknown = {
        id: 'msg-123',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
      };

      PacketValidator.ensurePType(data);

      // 在这里 TypeScript 应该知道 data 是 RawPacket 类型
      expect(data).toHaveProperty('ptype');
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('from');
      expect(data).toHaveProperty('to');
      expect(data).toHaveProperty('body');
      expect(data).toHaveProperty('ver');
      expect(data).toHaveProperty('timestamp');
    });

    it('isValidRawPacket 应该作为类型守卫', () => {
      const data: unknown = {
        id: 'msg-123',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
      };

      if (PacketValidator.isValidRawPacket(data)) {
        // 在这里 TypeScript 应该知道 data 是 RawPacket 类型
        expect(data.ptype).toBe(PacketMessageTypeEnum.ChatMessage);
        expect(data.id).toBe('msg-123');
      } else {
        expect(true).toBe(false); // 不应该到达这里
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理包含额外字段的数据包', () => {
      const packetWithExtraFields = {
        id: 'msg-123',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
        extraField: 'extra',
        anotherField: 123,
      };

      expect(PacketValidator.hasValidPtype(packetWithExtraFields)).toBe(true);
      expect(PacketValidator.isValidRawPacket(packetWithExtraFields)).toBe(
        true,
      );
    });

    it('应该处理包含可选字段的数据包', () => {
      const packetWithOptionalFields = {
        id: 'msg-123',
        mid: 'msg-456',
        upid: 'msg-789',
        from: { app: 'test', pin: '123' },
        to: { app: 'test', pin: '456' },
        ptype: PacketMessageTypeEnum.ChatMessage,
        body: {},
        ver: '1.0',
        timestamp: Date.now(),
        chatId: 'chat-123',
        entry: 'web',
      };

      expect(PacketValidator.isValidRawPacket(packetWithOptionalFields)).toBe(
        true,
      );
    });

    it('应该处理嵌套对象中的 ptype', () => {
      const nestedPacket = {
        data: {
          packet: {
            ptype: PacketMessageTypeEnum.ChatMessage,
          },
        },
      };

      // hasValidPtype 只检查顶层对象的 ptype
      expect(PacketValidator.hasValidPtype(nestedPacket as never)).toBe(false);
    });
  });
});
