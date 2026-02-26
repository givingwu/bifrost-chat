import type { StandardMessage } from '@/interfaces/message.interface';
import {
  ClientTypeEnum,
  MessageDirectionEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import type { RawPacket } from '@/interfaces/protocol.interface';
import { MessageBuilder } from '@/services/message-builder.service';

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
    };

    if (message.tempId) {
      // 可选字段
      rawPacket.mid = message.tempId;
    }

    return rawPacket;
  }

  /**
   * 将 RawPacket 转换为 StandardMessage（接收方向）
   *
   * @param packet RawPacket
   * @param direction 消息方向
   * @param currentPin 当前用户 pin（用于判断消息方向）
   * @returns StandardMessage
   */
  static toStandardMessage(
    packet: RawPacket,
    direction?: MessageDirectionEnum,
    currentPin?: string,
  ): StandardMessage {
    // 自动判断消息方向（如果未指定）
    let messageDirection = direction;

    if (!messageDirection && currentPin) {
      messageDirection =
        packet.from.pin === currentPin
          ? MessageDirectionEnum.Outgoing
          : MessageDirectionEnum.Incoming;
    }

    // 解析渠道类型
    const channelType = MessageBuilder.stringToChannelType(
      packet.from.channelType,
    );

    const standardMessage: StandardMessage = {
      id: packet.mid || packet.id,
      tempId: packet.id,
      direction: messageDirection || MessageDirectionEnum.Incoming,
      channelType,
      status: MessageStatusEnum.Sent,
      timestamp: packet.timestamp,
      type: MessageBuilder.packetBodyToMessageType(packet.body),
      content: MessageBuilder.packetBodyToMessageContent(packet.body),
      sender: {
        pin: packet.from.pin,
        app: packet.from.app,
        clientType: packet.from.clientType,
        channelType: MessageBuilder.stringToChannelType(
          packet.from.channelType,
        ),
      },
      receiver: {
        pin: packet.to.pin,
        app: packet.to.app,
        clientType: packet.to.clientType,
        channelType,
      },
    };

    return standardMessage;
  }
}
