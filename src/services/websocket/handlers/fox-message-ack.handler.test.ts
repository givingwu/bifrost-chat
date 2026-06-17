import { beforeEach, describe, expect, it } from 'vitest';
import {
  MessageStatusEnum,
  type MessageStatusUpdatedEvent,
} from '@/interfaces/message.interface';
import {
  PacketMessageTypeEnum,
  PacketSenderTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import { messageQueue } from '@/services/messaging/message-queue.service';
import { FoxMessageAckHandler } from './fox-message-ack.handler';

describe('FoxMessageAckHandler', () => {
  const handler = new FoxMessageAckHandler();

  beforeEach(() => {
    messageQueue.clear();
  });

  it('应保留原始 fox_message_ack 事件，并追加状态事件', () => {
    messageQueue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });
    messageQueue.bindServerMessageId('temp-123', '789');

    const result = handler.handle({
      packet: {
        id: 'fox-ack-1',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.FoxMessageAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          type: PacketMessageTypeEnum.FoxMessageAck,
          mid: 789,
          sendResult: 'REPLIED',
        } as unknown as RawPacket['body'],
        ver: '1.0',
        timestamp: 2_000,
      },
    });

    expect(result.eventData?.type).toBe(WebSocketEventTypeEnum.FoxMessageAck);
    expect(result.extraEvents).toHaveLength(1);
    expect(result.extraEvents?.[0]?.type).toBe(
      WebSocketEventTypeEnum.MessageStatus,
    );
    expect(
      (result.extraEvents?.[0]?.data as MessageStatusUpdatedEvent).status,
    ).toBe(MessageStatusEnum.Clicked);
  });

  it('队列命中时应把 Packet 顶层业务字段透传到状态事件 metadata', () => {
    messageQueue.enqueue({
      requestId: 'req-robot',
      tempId: 'temp-robot',
      conversationId: 'conv-robot',
    });
    messageQueue.bindServerMessageId('temp-robot', 'robot-mid');

    const result = handler.handle({
      packet: {
        id: 'fox-ack-robot',
        chatId: 'conv-robot',
        ptype: PacketMessageTypeEnum.FoxMessageAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        channelAccount: 'waba-account-001',
        senderType: PacketSenderTypeEnum.Chatbot,
        body: {
          type: PacketMessageTypeEnum.FoxMessageAck,
          id: 'robot-mid',
          sendResult: 'REPLIED',
        } as unknown as RawPacket['body'],
        ver: '1.0',
        timestamp: 2_100,
      },
    });

    expect(result.extraEvents?.[0]?.data).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          chatId: 'conv-robot',
          channelAccount: 'waba-account-001',
          senderType: PacketSenderTypeEnum.Chatbot,
        }),
      }),
    );
  });

  it('队列未命中时应保留原始事件，并在可解析时追加状态事件', () => {
    const result = handler.handle({
      packet: {
        id: 'fox-ack-2',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.FoxMessageAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        channelAccount: 'waba-account-002',
        senderType: PacketSenderTypeEnum.Chatbot,
        body: {
          type: PacketMessageTypeEnum.FoxMessageAck,
          mid: 999,
          sendResult: 'ACTION',
        } as unknown as RawPacket['body'],
        ver: '1.0',
        timestamp: 3_000,
      },
    });

    expect(result.eventData?.type).toBe(WebSocketEventTypeEnum.FoxMessageAck);
    expect(result.extraEvents).toHaveLength(1);
    expect(result.extraEvents?.[0]?.type).toBe(
      WebSocketEventTypeEnum.MessageStatus,
    );
    expect(result.extraEvents?.[0]?.data).toEqual(
      expect.objectContaining({
        conversationId: 'conv-456',
        messageId: '999',
        status: MessageStatusEnum.Clicked,
        metadata: expect.objectContaining({
          chatId: 'conv-456',
          channelAccount: 'waba-account-002',
          senderType: PacketSenderTypeEnum.Chatbot,
        }),
      }),
    );
  });
});
