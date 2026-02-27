import type { AckRawPacket, RawPacket } from '@/interfaces/protocol.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';

/**
 * 数据包验证工具
 *
 * @description
 * 提供协议数据包的验证功能，确保所有 socket 通信协议都包含必填的 `ptype` 字段。
 *
 * @note
 * 有效的 ptype 值包括：
 * - PacketMessageTypeEnum 中的所有值（auth, auth_fail, chat_message, ack, client_heartbeat, status_switch, fox_message_ack）
 * - AckMessageTypeEnum 中的上行 ACK 值（msg_read_ack, msg_receive_ack）
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <this is a right static class>
export class PacketValidator {
  /**
   * 有效的 ptype 值列表
   *
   * @description
   * 包括 PacketMessageTypeEnum 和 AckMessageTypeEnum 中的所有值
   */
  private static readonly VALID_PTYPE_VALUES = [
    ...Object.values(PacketMessageTypeEnum),
    ...Object.values(AckMessageTypeEnum),
  ];

  /**
   * 验证数据包是否包含有效的 ptype 字段
   *
   * @param data - 待验证的数据包
   * @returns 是否包含有效的 ptype 字段
   *
   * @example
   * ```typescript
   * const isValid = PacketValidator.hasValidPtype({
   *   ptype: 'chat_message',
   *   // ... other fields
   * });
   * // true
   *
   * const isInvalid = PacketValidator.hasValidPtype({
   *   type: 'chat_message', // 使用了 type 而不是 ptype
   *   // ... other fields
   * });
   * // false
   * ```
   */
  static hasValidPtype(packet: RawPacket | AckRawPacket): boolean {
    if (!packet || typeof packet !== 'object') {
      return false;
    }

    // 检查 ptype 字段是否存在
    if (typeof packet.ptype !== 'string') {
      return false;
    }

    // 检查 ptype 值是否有效
    return PacketValidator.VALID_PTYPE_VALUES.includes(
      packet.ptype as PacketMessageTypeEnum,
    );
  }

  /**
   * 确保数据包包含 ptype 字段，否则抛出错误
   *
   * @param data - 待验证的数据包
   * @throws {Error} 当 ptype 字段缺失或无效时抛出错误
   *
   * @example
   * ```typescript
   * try {
   *   PacketValidator.ensurePType({
   *     ptype: 'chat_message',
   *     // ... other fields
   *   });
   *   // 验证通过
   * } catch (error) {
   *   // 验证失败
   *   console.error(error.message);
   * }
   * ```
   */
  static ensurePType(data: unknown): asserts data is RawPacket {
    if (!data || typeof data !== 'object') {
      throw new Error(
        'Invalid packet: data must be an object with ptype field',
      );
    }

    const packet = data as Record<string, unknown>;

    if (typeof packet.ptype !== 'string') {
      throw new Error(
        'Invalid packet: ptype field is required and must be a string. ' +
          'Please use "ptype" instead of "type" for protocol message type.',
      );
    }

    if (
      !PacketValidator.VALID_PTYPE_VALUES.includes(
        packet.ptype as PacketMessageTypeEnum,
      )
    ) {
      throw new Error(
        `Invalid packet: ptype value "${packet.ptype}" is not valid. ` +
          `Valid values are: ${PacketValidator.VALID_PTYPE_VALUES.join(', ')}`,
      );
    }
  }

  /**
   * 验证数据包是否为有效的 RawPacket 格式
   *
   * @param data - 待验证的数据包
   * @returns 是否为有效的 RawPacket 格式
   *
   * @example
   * ```typescript
   * const isValid = PacketValidator.isValidRawPacket({
   *   id: 'msg-123',
   *   from: { app: 'test', pin: '123' },
   *   to: { app: 'test', pin: '456' },
   *   ptype: 'chat_message',
   *   body: {},
   *   ver: '1.0',
   *   timestamp: Date.now(),
   * });
   * // true
   * ```
   */
  static isValidRawPacket(data: unknown): data is RawPacket {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const packet = data as Record<string, unknown>;

    // 检查必填字段
    if (
      typeof packet.id !== 'string' ||
      typeof packet.from !== 'object' ||
      typeof packet.to !== 'object' ||
      typeof packet.ptype !== 'string' ||
      typeof packet.body !== 'object' ||
      typeof packet.ver !== 'string' ||
      typeof packet.timestamp !== 'number'
    ) {
      return false;
    }

    // 检查 ptype 值是否有效
    return PacketValidator.VALID_PTYPE_VALUES.includes(
      packet.ptype as PacketMessageTypeEnum,
    );
  }

  /**
   * 获取数据包的 ptype 值
   *
   * @param data - 数据包
   * @returns ptype 值，如果不存在则返回 undefined
   *
   * @example
   * ```typescript
   * const ptype = PacketValidator.getPType({
   *   ptype: 'chat_message',
   *   // ... other fields
   * });
   * // 'chat_message'
   * ```
   */
  static getPType(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const packet = data as Record<string, unknown>;
    return typeof packet.ptype === 'string' ? packet.ptype : undefined;
  }
}
