import type {
  HeartbeatParams,
  RawPacket,
} from '@/interfaces/protocol.interface';
import { PacketMessageTypeEnum } from '@/interfaces/protocol.interface';
import { MessageBuilder } from '../message-builder.service';

/**
 * HeartbeatManager - 心跳管理器
 *
 * @description
 * 负责心跳消息的创建和验证
 *
 * @example
 * ```typescript
 * // 创建心跳消息
 * const heartbeat = HeartbeatManager.createHeartbeat({
 *   fromApp: 'fox_collect.waiter',
 *   fromPin: 'agent-123',
 *   toApp: 'im.waiter',
 *   toPin: 'customer-456',
 * });
 * wsManager.send(heartbeat);
 *
 * // 验证心跳响应
 * if (HeartbeatManager.isHeartbeatResponse(data)) {
 *   console.log('Heartbeat acknowledged');
 * }
 * ```
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <- 允许静态方法的类>
export class HeartbeatManager {
  /**
   * 创建心跳消息
   *
   * @param params 心跳消息参数
   * @returns RawPacket 心跳消息
   */
  static createHeartbeat(params: HeartbeatParams): RawPacket {
    const heartbeatPacket: RawPacket = {
      id: MessageBuilder.generateUniqueId(),
      from: {
        app: params.fromApp,
        pin: params.fromPin,
      },
      to: {
        app: params.toApp,
        pin: params.toPin,
      },
      ptype: PacketMessageTypeEnum.ClientHeartbeat,
      body: {},
      ver: '1.0',
      timestamp: Date.now(),
    };

    return heartbeatPacket;
  }

  /**
   * 验证是否为心跳响应
   *
   * @param data 原始数据
   * @returns 是否为心跳响应
   */
  static isHeartbeatResponse(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const packet = data as RawPacket;

    // 检查是否为 ACK 类型
    if (packet.ptype !== PacketMessageTypeEnum.Ack) {
      return false;
    }

    // 检查 body 是否存在
    if (!packet.body || typeof packet.body !== 'object') {
      return false;
    }

    // 检查是否为心跳 ACK
    return (
      'type' in packet.body &&
      packet.body.type === PacketMessageTypeEnum.ClientHeartbeat
    );
  }

  /**
   * 创建心跳 ACK 响应
   *
   * @param originalHeartbeat 原始心跳消息
   * @returns RawPacket 心跳 ACK
   */
  static createHeartbeatAck(originalHeartbeat: RawPacket): RawPacket {
    const ackPacket: RawPacket = {
      id: originalHeartbeat.id,
      from: originalHeartbeat.to,
      to: originalHeartbeat.from,
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: PacketMessageTypeEnum.ClientHeartbeat,
      },
      ver: '1.0',
      timestamp: Date.now(),
    };

    return ackPacket;
  }

  /**
   * 验证心跳消息格式
   *
   * @param data 原始数据
   * @returns 是否为有效的心跳消息
   */
  static isValidHeartbeat(data: unknown): data is RawPacket {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const packet = data as Partial<RawPacket>;

    // 检查类型
    if (packet.ptype !== PacketMessageTypeEnum.ClientHeartbeat) {
      return false;
    }

    // 检查必要字段
    if (
      typeof packet.id !== 'string' ||
      !packet.from ||
      !packet.to ||
      !packet.body ||
      typeof packet.body !== 'object'
    ) {
      return false;
    }

    // 检查 from 和 to 的结构
    if (
      typeof packet.from.app !== 'string' ||
      typeof packet.from.pin !== 'string' ||
      typeof packet.to.app !== 'string' ||
      typeof packet.to.pin !== 'string'
    ) {
      return false;
    }

    // 检查 body 是否为空对象
    const body = packet.body as Record<string, unknown>;
    if (Object.keys(body).length > 0) {
      return false;
    }

    return true;
  }
}
