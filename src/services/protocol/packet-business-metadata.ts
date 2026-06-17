import {
  PacketSenderTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';

/**
 * 将 Packet senderType 原始值归一化为枚举。
 *
 * @param senderType Packet 或 metadata 中的 senderType 原始值
 * @returns 规范 senderType 枚举；无法识别时返回 undefined
 */
export function normalizePacketSenderType(
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
 * 标准消息的核心 identity，但消息气泡与状态回执需要依赖这些字段展示
 * 发送号码尾号和 Chatbot 标识，因此统一放入 StandardMessage.metadata 透传。
 *
 * @param packet 原始 Packet
 * @returns 可合并进 StandardMessage.metadata 的业务字段
 */
export function buildPacketBusinessMetadata(
  packet: Pick<RawPacket, 'chatId' | 'channelAccount' | 'senderType' | 'entry'>,
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
 * 将 Packet 顶层业务字段合并到已有事件 metadata。
 *
 * @param event 需要补充 metadata 的事件
 * @param packet 原始 Packet
 * @returns 已合并 Packet 业务字段的新事件
 */
export function withPacketBusinessMetadata<T extends object>(
  event: T,
  packet: RawPacket,
): T & { metadata: Record<string, unknown> } {
  const eventMetadata =
    'metadata' in event &&
    event.metadata &&
    typeof event.metadata === 'object' &&
    !Array.isArray(event.metadata)
      ? (event.metadata as Record<string, unknown>)
      : undefined;

  return {
    ...event,
    metadata: {
      ...eventMetadata,
      ...buildPacketBusinessMetadata(packet),
    },
  };
}
