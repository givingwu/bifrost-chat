import type {
  AckPacketBody,
  AckRawPacket,
  BaseRawPacket,
} from '@/interfaces/protocol.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';

/**
 * 类型守卫：判断是否为 ACK RawPacket
 */
export function isAckRawPacket(packet: BaseRawPacket): packet is AckRawPacket {
  return (
    packet.ptype === PacketMessageTypeEnum.Ack ||
    packet.ptype === PacketMessageTypeEnum.MessageStatusAck ||
    packet.ptype === AckMessageTypeEnum.MsgReceiveAck ||
    packet.ptype === AckMessageTypeEnum.MsgReadAck ||
    packet.ptype === AckMessageTypeEnum.MsgSendFailed
  );
}

/**
 * 类型守卫：判断 Packet body 是否为 AckPacketBody
 */
export function isAckPacketBody(body: unknown): body is AckPacketBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'sender' in body &&
    'app' in body &&
    'mid' in body &&
    'timestamp' in body
  );
}
