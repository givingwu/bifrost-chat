import { beforeEach, describe, expect, it } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  PacketMessageTypeEnum,
  type RawPacket,
} from '@/interfaces/protocol.interface';
import { WebSocketEventTypeEnum } from '@/interfaces/websocket.interface';
import type { MessageStatusUpdatedEvent } from '@/services/message.service';
import { messageQueue } from '@/services/message-queue.service';
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
    ).toBe(MessageStatusEnum.Read);
  });

  it('队列未命中时也应保留原始 fox_message_ack 事件', () => {
    const result = handler.handle({
      packet: {
        id: 'fox-ack-2',
        chatId: 'conv-456',
        ptype: PacketMessageTypeEnum.FoxMessageAck,
        from: { app: 'test', pin: 'server' },
        to: { app: 'test', pin: 'user' },
        body: {
          type: PacketMessageTypeEnum.FoxMessageAck,
          mid: 999,
          sendResult: 'DELIVER_SUCCESS',
        } as unknown as RawPacket['body'],
        ver: '1.0',
        timestamp: 3_000,
      },
    });

    expect(result.eventData?.type).toBe(WebSocketEventTypeEnum.FoxMessageAck);
    expect(result.extraEvents).toBeUndefined();
  });
});
