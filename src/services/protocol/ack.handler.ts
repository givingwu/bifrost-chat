import {
  ClientTypeEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import type {
  AckPacketBody,
  AckRawPacket,
} from '@/interfaces/protocol.interface';
import {
  AckMessageTypeEnum,
  isPacketBodyRecord,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import {
  isServerMessageStatus,
  mapServerMessageStatusToLocal,
} from '@/services/protocol/status.mapper';
import { MessageBuilder } from '@/services/messaging/message-builder.service';
import {
  buildOptionalFields,
  extractMessageId,
  extractTimestamp,
} from '@/utils/packet.util';

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
    id?: string;
    chatId?: string;
    sender?: string;
    status?: string;
    errorInfo?: string;
  };
  /** 时间戳 */
  timestamp?: number;
}

interface AckCreateOptions {
  requestId?: string;
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
 *   mid: 'msg-456',
 *   chatId: 'conv-123',
 *   timestamp: Date.now(),
 * });
 * // ptype 为 'msg_read_ack'
 *
 * // 创建上行收到消息 ACK
 * const receiveAck = AckHandler.createReceiveAck({
 *   sender: 'agent-123',
 *   app: 'fox_collect.waiter',
 *   mid: 'msg-456',
 *   chatId: 'conv-123',
 *   timestamp: Date.now(),
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
  static createReadAck(
    params: AckPacketBody,
    options?: AckCreateOptions,
  ): AckRawPacket {
    const ackPacket: AckRawPacket = {
      id: options?.requestId ?? MessageBuilder.generateUniqueId(),
      chatId: params.chatId,
      from: {
        app: params.app,
        pin: params.sender,
        clientType: ClientTypeEnum.Web,
      },
      to: {
        app: '',
        pin: '',
      },
      // ✅ 使用 msg_read_ack 作为 ptype（上行协议）
      ptype: AckMessageTypeEnum.MsgReadAck,
      body: params,
      ver: '1.0',
      timestamp: Date.now(),
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
  static createReceiveAck(
    params: AckPacketBody,
    options?: AckCreateOptions,
  ): AckRawPacket {
    const ackPacket: AckRawPacket = {
      id: options?.requestId ?? MessageBuilder.generateUniqueId(),
      chatId: params.chatId,
      from: {
        app: params.app,
        pin: params.sender,
        clientType: ClientTypeEnum.Web,
      },
      to: {
        app: '',
        pin: '',
      },
      // ✅ 使用 msg_receive_ack 作为 ptype（上行协议）
      ptype: AckMessageTypeEnum.MsgReceiveAck,
      body: params,
      ver: '1.0',
      timestamp: Date.now(),
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

    // 处理新格式： message_status_ack
    if (packet.ptype === PacketMessageTypeEnum.MessageStatusAck) {
      return AckHandler.parseMessageStatusAck(packet);
    }

    // 处理旧格式： ptype = ack
    if (packet.ptype !== PacketMessageTypeEnum.Ack) {
      return null;
    }

    if (!packet.body) {
      return null;
    }

    if (
      !isPacketBodyRecord(packet.body) ||
      typeof packet.body.type !== 'string'
    ) {
      return null;
    }

    const messageId = extractMessageId(
      packet.id,
      packet.body.id,
      packet.body.mid,
    );

    if (!messageId) {
      return null;
    }

    const timestamp = extractTimestamp(packet.timestamp, packet.body.timestamp);

    return {
      id: messageId,
      ptype: packet.ptype as PacketMessageTypeEnum,
      body: {
        type: packet.body.type,
        ...buildOptionalFields({
          id: packet.body.id,
          chatId: packet.body.chatId,
          sender: packet.body.sender,
          status: packet.body.status,
          errorInfo: packet.body.errorInfo,
        }),
      },
      timestamp,
    };
  }

  /**
   * 解析新格式 message_status_ack 下行包
   *
   * @description
   * 新协议结构：
   * - ptype: 'message_status_ack'
   * - body.id: 消息 ID（必填）
   * - body.chatId: 会话 ID
   * - body.status: 状态枚举（UN_SEND/SEND_FAIL/DELIVER_FAIL/UN_READ/READ/REVOKE/DELETE）
   * - body.sender: 发送者
   * - body.timestamp: 时间戳
   * - body.errorInfo: 错误描述（可选）
   */
  private static parseMessageStatusAck(
    packet: Record<string, unknown>,
  ): AckData | null {
    if (!isPacketBodyRecord(packet.body)) {
      return null;
    }

    // 新协议 message_status_ack 的消息 ID 在 body.id，不使用 packet.id
    const messageId = extractMessageId(
      undefined,
      packet.body.id,
      packet.body.mid,
    );

    if (!messageId) {
      return null;
    }

    const timestamp = extractTimestamp(packet.body.timestamp, packet.timestamp);

    return {
      id: messageId,
      ptype: PacketMessageTypeEnum.MessageStatusAck,
      body: {
        // type 设为 ptype 本身，因为新协议的 body 中没有独立的 type 字段
        type: PacketMessageTypeEnum.MessageStatusAck,
        ...buildOptionalFields({
          id: packet.body.id,
          chatId: packet.body.chatId,
          sender: packet.body.sender,
          status: packet.body.status,
          errorInfo: packet.body.errorInfo,
        }),
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
      Object.values(PacketMessageTypeEnum).includes(
        type as PacketMessageTypeEnum,
      )
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
      case PacketMessageTypeEnum.MessageStatusAck:
        // 新格式的状态由 body.status 决定，这里返回 Sent 作为默认占位符
        // 实际状态将经由 ackDataToMessageStatus() 中的 body.status 路径解析
        return MessageStatusEnum.Sent;
      default:
        return MessageStatusEnum.Sent;
    }
  }

  /**
   * 解析 ACK/状态回调对应的消息状态
   *
   * @description
   * 新版状态回调会通过 body.status 携带真实状态，此时应优先使用
   * body.status，而不是仅凭 body.type 推断。
   *
   * @param ackData ACK 数据
   * @returns 消息状态；若 body.status 非法则返回 undefined
   */
  static ackDataToMessageStatus(
    ackData: AckData,
  ): MessageStatusEnum | undefined {
    if (ackData.body.status !== undefined) {
      return isServerMessageStatus(ackData.body.status)
        ? mapServerMessageStatusToLocal(ackData.body.status)
        : undefined;
    }

    return AckHandler.ackTypeToMessageStatus(ackData.body.type);
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
