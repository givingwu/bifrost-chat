import type { PacketBodyBase, ServerMessageStatus } from '@/index';
import { mapServerMessageStatusToLocal } from '@/index';
import {
  ClientTypeEnum,
  MessageDirectionEnum,
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  isPacketBodyRecord,
  PacketSenderTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { MessageBuilder } from '@/services/messaging/message-builder.service';

/**
 * 将 Packet senderType 原始值归一化为枚举。
 *
 * @description
 * Packet 历史数据可能以数字或字符串表示 senderType。转换边界统一归一
 * 为 `PacketSenderTypeEnum`，后续 UI 和业务判断只比较枚举值。
 *
 * @param senderType Packet 或 metadata 中的 senderType 原始值
 * @returns 规范 senderType 枚举；无法识别时返回 undefined
 */
function normalizePacketSenderType(
  senderType: unknown,
): PacketSenderTypeEnum | undefined {
  if (
    senderType === PacketSenderTypeEnum.Chatbot ||
    senderType === String(PacketSenderTypeEnum.Chatbot)
  ) {
    return PacketSenderTypeEnum.Chatbot;
  }

  if (
    senderType === PacketSenderTypeEnum.Manual ||
    senderType === String(PacketSenderTypeEnum.Manual)
  ) {
    return PacketSenderTypeEnum.Manual;
  }

  return undefined;
}

/**
 * 构建 Packet 顶层业务字段 metadata。
 *
 * @description
 * Packet 协议中 `channelAccount` / `senderType` / `entry` 等字段不属于
 * 标准消息的核心 identity，但默认消息气泡需要依赖这些字段展示发送号码
 * 尾号和 Chatbot 标识，因此统一放入 StandardMessage.metadata 透传。
 *
 * @param packet 原始 Packet
 * @returns 可合并进 StandardMessage.metadata 的业务字段
 */
function buildPacketBusinessMetadata(
  packet: RawPacket,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    chatId: packet.chatId,
  };

  if (packet.channelAccount) {
    metadata.channelAccount = packet.channelAccount;
  }

  const senderType = normalizePacketSenderType(packet.senderType);
  if (senderType !== undefined) {
    metadata.senderType = senderType;
  }

  if (packet.entry) {
    metadata.entry = packet.entry;
  }

  return metadata;
}

/**
 * 从 StandardMessage.metadata 构建 RawPacket 顶层业务字段。
 *
 * @param metadata 标准消息 metadata
 * @returns 可合并进 RawPacket 的顶层业务字段
 */
function buildRawPacketBusinessFields(
  metadata: StandardMessage['metadata'],
): Pick<RawPacket, 'channelAccount' | 'senderType' | 'entry'> {
  const fields: Pick<RawPacket, 'channelAccount' | 'senderType' | 'entry'> = {};

  if (typeof metadata?.channelAccount === 'string') {
    fields.channelAccount = metadata.channelAccount;
  }

  const senderType = normalizePacketSenderType(metadata?.senderType);
  if (senderType !== undefined || metadata?.senderType === null) {
    fields.senderType = senderType ?? null;
  }

  if (typeof metadata?.entry === 'string') {
    fields.entry = metadata.entry;
  }

  return fields;
}

/**
 * PacketConverter - Packet 协议转换器
 *
 * @description
 * 负责 StandardMessage 和 RawPacket 之间的双向转换
 *
 * @example
 * ```typescript
 * // StandardMessage -> RawPacket（发送）
 * const rawPacket = PacketConverter.toRawPacket(
 *   standardMessage,
 *   'fox_collect.waiter',
 *   'agent-123'
 * );
 *
 * // RawPacket -> StandardMessage（接收）
 * const standardMessage = PacketConverter.toStandardMessage(
 *   rawPacket,
 *   MessageDirectionEnum.Incoming,
 *   'agent-123'
 * );
 * ```
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <PacketConverter needs to be a static utility class>
export class PacketConverter {
  /**
   * 将 StandardMessage 转换为 RawPacket（发送方向）
   *
   * @param message 标准消息
   * @param fromApp 发送方 app
   * @param fromPin 发送方 pin
   * @returns RawPacket
   */
  static toRawPacket(
    message: StandardMessage,
    fromApp: string,
    fromPin: string,
  ): RawPacket {
    if (!message.receiver || !message.receiver.app || !message.receiver.pin) {
      throw new Error(
        'Message receiver is required and must have valid app and pin fields',
      );
    }

    const rawPacket: RawPacket = {
      id: message.id,
      chatId: message.conversationId,
      from: {
        app: fromApp,
        pin: fromPin,
        channelType: MessageBuilder.channelTypeToString(message.channelType),
        clientType: message.sender?.clientType ?? ClientTypeEnum.Web,
      },
      to: {
        app: message.receiver.app,
        pin: message.receiver.pin,
        channelType: message.receiver.channelType,
        clientType: message.receiver.clientType,
      },
      ptype: MessageBuilder.messageTypeToPacketType(message.type),
      body: MessageBuilder.messageContentToPacketBody(
        message.type,
        message.content,
      ),
      ver: '1.0',
      timestamp: message.timestamp,
      ...buildRawPacketBusinessFields(message.metadata),
    };

    return rawPacket;
  }

  /**
   * 将 RawPacket 转换为 StandardMessage（接收方向）
   *
   * @param packet RawPacket
   * @param direction 消息方向
   * @param currentApp 当前用户 app（用于判断消息方向）
   * @returns StandardMessage
   */
  static toStandardMessage(
    packet: RawPacket,
    direction?: MessageDirectionEnum,
    currentApp?: string,
  ): StandardMessage {
    // 自动判断消息方向（如果未指定）
    let messageDirection = direction;

    if (!messageDirection && currentApp) {
      messageDirection =
        packet.from.app === currentApp
          ? MessageDirectionEnum.Outgoing
          : MessageDirectionEnum.Incoming;
    }

    // 解析渠道类型
    const channelType = MessageBuilder.stringToChannelType(
      packet.from.channelType,
    );

    // 安全提取 ext 字段（仅 PacketBodyBase 子类型有此字段）
    // ext 可能是对象或 JSON 字符串，需要统一处理为 Record<string, unknown>
    // packet.body 可能为空字符串，需先校验为有效对象再访问 ext
    let extMetadata: Record<string, unknown> | undefined;
    const body = packet.body;
    if (isPacketBodyRecord(body) && body.ext) {
      const ext = body.ext;
      if (typeof ext === 'object') {
        extMetadata = ext as Record<string, unknown>;
      } else if (typeof ext === 'string') {
        try {
          extMetadata = JSON.parse(ext) as Record<string, unknown>;
        } catch {
          // JSON 解析失败时忽略
          extMetadata = undefined;
        }
      }
    }

    const standardMessage: StandardMessage = {
      id: packet.mid || packet.id,
      tempId: packet.id,
      conversationId: packet.chatId,
      direction: messageDirection || MessageDirectionEnum.Incoming,
      channelType,
      status: packet.status
        ? mapServerMessageStatusToLocal(
            packet.status?.toUpperCase() as ServerMessageStatus,
          )
        : (messageDirection || MessageDirectionEnum.Incoming) ===
            MessageDirectionEnum.Incoming
          ? MessageStatusEnum.Sent
          : MessageStatusEnum.Created,
      timestamp: packet.timestamp,
      type: MessageBuilder.packetBodyToMessageType(packet.body),
      content: MessageBuilder.packetBodyToMessageContent(packet.body),
      sender: {
        pin: packet.from.pin,
        app: packet.from.app,
        clientType: packet.from.clientType,
        channelType,
      },
      receiver: {
        pin: packet.to.pin,
        app: packet.to.app,
        clientType: packet.to.clientType,
        channelType: packet.to.channelType,
      },
      metadata: {
        ...(packet.body as PacketBodyBase)?.chatInfo,
        ...extMetadata,
        ...buildPacketBusinessMetadata(packet),
      },
    };

    return standardMessage;
  }
}
