import {
  ClientTypeEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import type { RawPacket, ReadAckParams } from '@/interfaces/protocol.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import { MessageBuilder } from '@/services/message-builder.service';

// Re-export AckMessageTypeEnum for external use
export { AckMessageTypeEnum } from '@/interfaces/protocol.interface';

/**
 * ACK 数据结构（下行）
 */
export interface AckData {
  /** 消息 ID */
  id: string;
  /** 协议消息类型枚举 */
  ptype: PacketMessageTypeEnum;
  /** Body */
  body: {
    type: string;
  };
  /** 时间戳 */
  timestamp?: number;
}

/**
 * AckHandler - ACK 处理器
 *
 * @description
 * 负责 ACK 消息的创建和解析
 *
 * 上行 ACK（客户端 → 服务端）：
 * - createReadAck() - 创建已读 ACK，ptype 为 `msg_read_ack`
 * - createReceiveAck() - 创建收到消息 ACK，ptype 为 `msg_receive_ack`
 *
 * 下行 ACK（服务端 → 客户端）：
 * - parseDownstream() - 解析下行 ACK，ptype 为 `ack`，body.type 为具体类型
 *
 * @example
 * ```typescript
 * // 创建上行已读 ACK
 * const ackMessage = AckHandler.createReadAck({
 *   sender: 'agent-123',
 *   app: 'fox_collect.waiter',
 *   messageId: 'msg-456',
 *   sessionId: 'conv-123',
 *   datetime: Date.now(),
 *   toApp: 'im.waiter',
 *   toPin: 'customer-456',
 * });
 * // ptype 为 'msg_read_ack'
 *
 * // 创建上行收到消息 ACK
 * const receiveAck = AckHandler.createReceiveAck({
 *   sender: 'agent-123',
 *   app: 'fox_collect.waiter',
 *   messageId: 'msg-456',
 *   sessionId: 'conv-123',
 *   datetime: Date.now(),
 *   toApp: 'im.waiter',
 *   toPin: 'customer-456',
 * });
 * // ptype 为 'msg_receive_ack'
 *
 * // 解析下行 ACK
 * const ackData = AckHandler.parseDownstream(data);
 * if (ackData) {
 *   const status = AckHandler.ackTypeToMessageStatus(ackData.body.type);
 *   console.log('Message status:', status);
 * }
 * ```
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <- 该类仅包含静态方法，符合设计预期>
export class AckHandler {
  /**
   * 创建已读 ACK 消息
   *
   * @description
   * 创建上行已读 ACK 消息，ptype 为 `msg_read_ack`
   *
   * @param params 已读 ACK 参数
   * @returns RawPacket
   */
  static createReadAck(params: ReadAckParams): RawPacket {
    const ackPacket: RawPacket = {
      id: MessageBuilder.generateUniqueId(),
      from: {
        app: params.app,
        pin: params.sender,
        clientType: ClientTypeEnum.Web,
      },
      to: {
        app: params.toApp,
        pin: params.toPin,
      },
      // ✅ 使用 msg_read_ack 作为 ptype（上行协议）
      ptype: AckMessageTypeEnum.MsgReadAck,
      body: {
        sender: params.sender,
        app: params.app,
        mid: params.messageId,
        sessionId: params.sessionId,
        datetime: params.datetime,
      },
      ver: '1.0',
      timestamp: params.datetime,
    };

    return ackPacket;
  }

  /**
   * 创建收到消息 ACK 消息
   *
   * @description
   * 创建上行收到消息 ACK 消息，ptype 为 `msg_receive_ack`
   *
   * @param params 收到 ACK 参数
   * @returns RawPacket
   */
  static createReceiveAck(params: ReadAckParams): RawPacket {
    const ackPacket: RawPacket = {
      id: MessageBuilder.generateUniqueId(),
      from: {
        app: params.app,
        pin: params.sender,
      },
      to: {
        app: params.toApp,
        pin: params.toPin,
      },
      // ✅ 使用 msg_receive_ack 作为 ptype（上行协议）
      ptype: AckMessageTypeEnum.MsgReceiveAck,
      body: {
        sender: params.sender,
        app: params.app,
        mid: params.messageId,
        sessionId: params.sessionId,
        datetime: params.datetime,
      },
      ver: '1.0',
      timestamp: params.datetime,
    };

    return ackPacket;
  }

  /**
   * 解析下行 ACK 消息
   *
   * @param data 原始数据
   * @returns ACK 数据或 null
   */
  static parseDownstream(data: unknown): AckData | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const packet = data as Record<string, unknown>;

    // 检查是否为 ACK 类型
    if (packet.ptype !== PacketMessageTypeEnum.Ack) {
      return null;
    }

    // 检查是否有 id 和 body
    if (!packet.id || !packet.body) {
      return null;
    }

    const body = packet.body as Record<string, unknown>;

    if (!body.type || typeof body.type !== 'string') {
      return null;
    }

    // 处理 timestamp - 如果是数字则使用，否则返回 undefined
    const timestamp =
      typeof packet.timestamp === 'number' ? packet.timestamp : undefined;

    return {
      id: packet.id as string,
      ptype: packet.ptype as PacketMessageTypeEnum,
      body: {
        type: body.type as string,
      },
      timestamp,
    };
  }

  /**
   * 验证 ACK 类型是否有效
   *
   * @param type ACK 类型
   * @returns 是否有效
   */
  static isValidAckType(type: string): boolean {
    return (
      Object.values(AckMessageTypeEnum).includes(type as AckMessageTypeEnum) ||
      type === PacketMessageTypeEnum.Ack
    );
  }

  /**
   * 将 ACK 类型映射到消息状态
   *
   * @param type ACK 类型
   * @returns 消息状态
   */
  static ackTypeToMessageStatus(type: string): MessageStatusEnum {
    switch (type) {
      case AckMessageTypeEnum.MsgReceiveAck:
        return MessageStatusEnum.Delivered;
      case AckMessageTypeEnum.MsgReadAck:
        return MessageStatusEnum.Read;
      case AckMessageTypeEnum.MsgSendFailed:
        return MessageStatusEnum.Failed;
      case PacketMessageTypeEnum.ClientHeartbeat:
        // 心跳 ACK 不对应消息状态
        return MessageStatusEnum.Sent;
      default:
        return MessageStatusEnum.Sent;
    }
  }

  /**
   * 判断是否为心跳 ACK
   *
   * @param data 原始数据
   * @returns 是否为心跳 ACK
   */
  static isHeartbeatAck(data: unknown): boolean {
    const ackData = AckHandler.parseDownstream(data);

    if (!ackData) {
      return false;
    }

    return ackData.body.type === PacketMessageTypeEnum.ClientHeartbeat;
  }

  /**
   * 判断是否为消息发送失败 ACK
   *
   * @param data 原始数据
   * @returns 是否为发送失败 ACK
   */
  static isSendFailedAck(data: unknown): boolean {
    const ackData = AckHandler.parseDownstream(data);

    if (!ackData) {
      return false;
    }

    return ackData.body.type === AckMessageTypeEnum.MsgSendFailed;
  }

  /**
   * 判断是否为已读 ACK
   *
   * @param data 原始数据
   * @returns 是否为已读 ACK
   */
  static isReadAck(data: unknown): boolean {
    const ackData = AckHandler.parseDownstream(data);

    if (!ackData) {
      return false;
    }

    return ackData.body.type === AckMessageTypeEnum.MsgReadAck;
  }

  /**
   * 判断是否为已接收 ACK
   *
   * @param data 原始数据
   * @returns 是否为已接收 ACK
   */
  static isReceiveAck(data: unknown): boolean {
    const ackData = AckHandler.parseDownstream(data);

    if (!ackData) {
      return false;
    }

    return ackData.body.type === AckMessageTypeEnum.MsgReceiveAck;
  }
}
