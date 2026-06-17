import { beforeEach, describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import {
  type AckData,
  MessageQueueStageEnum,
  type RegisterMessageParams,
} from '@/interfaces/message-queue.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import { MessageQueueService } from './message-queue.service';

describe('MessageQueueService', () => {
  let queue: MessageQueueService;

  beforeEach(() => {
    queue = new MessageQueueService({
      enableTimeoutCheck: false,
      defaultTimeout: 10_000,
    });
  });

  it('应注册 outgoing 队列项并建立请求索引', () => {
    const params: RegisterMessageParams = {
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    };

    const item = queue.enqueue(params);

    expect(item).toBeDefined();
    expect(queue.size()).toBe(1);
    expect(queue.findById('req-123')?.conversationId).toBe('conv-456');
    expect(queue.findByTempId('temp-123')?.stage).toBe(
      MessageQueueStageEnum.PendingSendAck,
    );
  });

  it('应处理 chat_message ACK 并绑定服务端消息 ID', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });

    const result = queue.handleAck({
      id: 'req-123',
      ptype: PacketMessageTypeEnum.Ack,
      mid: 789,
      body: {
        type: PacketMessageTypeEnum.ChatMessage,
        mid: 789,
      },
      timestamp: 1_000,
    });

    expect(result.handled).toBe(true);
    expect(result.statusEvent).toEqual({
      conversationId: 'conv-456',
      messageId: 'req-123',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Sent,
      timestamp: expect.any(Number),
    });
    expect(queue.findByMid(789)?.stage).toBe(
      MessageQueueStageEnum.PendingChannelReceipt,
    );
  });

  it('chat_message ACK 的 mid=0 不应覆盖 requestId', () => {
    const requestId = 'chat_1781687884412_zh8an34c1';
    queue.enqueue({
      requestId,
      tempId: requestId,
      conversationId: 'fox_collect_w36309',
      rawMessage: {
        id: requestId,
        tempId: requestId,
        conversationId: 'fox_collect_w36309',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Sent,
        timestamp: 1_781_687_885_024,
        type: MessageTypeEnum.Text,
        content: { text: '你好' },
        sender: { app: 'fox_collect.waiter', pin: 'agent-1' },
        receiver: { app: 'fox_collect.customer', pin: 'customer-1' },
      },
    });

    queue.handleAck({
      id: requestId,
      ptype: PacketMessageTypeEnum.Ack,
      mid: 0,
      body: {
        type: PacketMessageTypeEnum.ChatMessage,
      },
      timestamp: 1_781_687_885_105,
    });

    const result = queue.handleAck({
      id: '95f43397b9fd4d4aa6bfa25fb44d247a',
      ptype: PacketMessageTypeEnum.MessageStatusAck,
      mid: 0,
      body: {
        type: PacketMessageTypeEnum.MessageStatusAck,
        id: requestId,
        chatId: 'fox_collect_w36309',
        status: 'un_send',
        errorInfo: 'send msg fail',
      },
      timestamp: 1_781_687_885_637,
    });

    expect(result.handled).toBe(true);
    expect(result.statusEvent).toEqual(
      expect.objectContaining({
        conversationId: 'fox_collect_w36309',
        messageId: requestId,
        tempId: requestId,
        status: MessageStatusEnum.Sent,
      }),
    );
    expect(queue.findByMid(0)).toBeUndefined();
  });

  it('应通过 receipt ack 把原消息推进为 delivered/read', () => {
    queue.enqueueReceiptAck({
      ackRequestId: 'receive-ack-1',
      conversationId: 'conv-456',
      targetMessageId: 'msg-123',
      targetTempId: 'temp-123',
      targetStatus: MessageStatusEnum.Delivered,
      ackKind: 'receive',
    });

    const delivered = queue.handleAck({
      id: 'receive-ack-1',
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: AckMessageTypeEnum.MsgReceiveAck,
      },
      timestamp: 2_000,
    });

    expect(delivered.handled).toBe(true);
    expect(delivered.statusEvent).toEqual({
      conversationId: 'conv-456',
      messageId: 'msg-123',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Delivered,
      timestamp: 2_000,
    });
    expect(queue.findById('receive-ack-1')).toBeUndefined();

    queue.enqueueReceiptAck({
      ackRequestId: 'read-ack-1',
      conversationId: 'conv-456',
      targetMessageId: 'msg-123',
      targetTempId: 'temp-123',
      targetStatus: MessageStatusEnum.Read,
      ackKind: 'read',
    });

    const read = queue.handleAck({
      id: 'read-ack-1',
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: AckMessageTypeEnum.MsgReadAck,
      },
      timestamp: 3_000,
    });

    expect(read.handled).toBe(true);
    expect(read.statusEvent?.status).toBe(MessageStatusEnum.Read);
    expect(queue.findById('read-ack-1')).toBeUndefined();
  });

  it('应支持重置 receipt ack requestId', () => {
    queue.enqueueReceiptAck({
      ackRequestId: 'read-ack-old',
      conversationId: 'conv-456',
      targetMessageId: 'msg-123',
      targetStatus: MessageStatusEnum.Read,
    });

    expect(queue.rekeyReceiptAck('read-ack-old', 'read-ack-new')).toBe(true);
    expect(queue.findById('read-ack-old')).toBeUndefined();
    expect(queue.findById('read-ack-new')).toBeDefined();
  });

  it('应缓存并回放乱序到达的 fox_message_ack 点击事件', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });

    const orphanAck: AckData = {
      id: 'fox-ack-1',
      ptype: PacketMessageTypeEnum.FoxMessageAck,
      body: {
        type: PacketMessageTypeEnum.FoxMessageAck,
        mid: 789,
        sendResult: 'REPLIED',
      },
      timestamp: 4_000,
    };

    const firstResult = queue.handleAck(orphanAck);
    expect(firstResult.handled).toBe(false);

    const replayedEvents = queue.bindServerMessageId('temp-123', '789');
    expect(replayedEvents).toHaveLength(1);
    expect(replayedEvents[0]).toEqual({
      conversationId: 'conv-456',
      messageId: '789',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Clicked,
      timestamp: expect.any(Number),
    });
    expect(queue.findByTempId('temp-123')).toBeUndefined();
  });

  it('点击事件应覆盖已读状态', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
      rawMessage: {
        id: '789',
        tempId: 'temp-123',
        conversationId: 'conv-456',
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Read,
        timestamp: 1_000,
        type: MessageTypeEnum.Text,
        content: { text: 'template' },
        sender: { app: 'fox_collect.waiter', pin: 'agent-1' },
        receiver: { app: 'fox_collect.customer', pin: 'customer-1' },
      },
    });
    queue.bindServerMessageId('temp-123', '789');

    const result = queue.handleAck({
      id: '789',
      ptype: PacketMessageTypeEnum.FoxMessageAck,
      body: {
        type: PacketMessageTypeEnum.FoxMessageAck,
        mid: 789,
        sendResult: 'ACTION',
      },
      timestamp: 4_000,
    });

    expect(result.handled).toBe(true);
    expect(result.statusEvent?.status).toBe(MessageStatusEnum.Clicked);
  });

  it('应处理 msg_read_ack 状态回调并将消息更新为 delivered', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });
    queue.bindServerMessageId('temp-123', '789');

    const result = queue.handleAck({
      id: '789',
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: AckMessageTypeEnum.MsgReadAck,
        id: '789',
        status: 'UN_READ',
      },
      timestamp: 5_000,
    });

    expect(result.handled).toBe(true);
    expect(result.statusEvent).toEqual({
      conversationId: 'conv-456',
      messageId: '789',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Delivered,
      timestamp: expect.any(Number),
    });
    expect(queue.findByTempId('temp-123')?.stage).toBe(
      MessageQueueStageEnum.Delivered,
    );
  });

  it('应缓存并回放乱序到达的 msg_read_ack 状态回调', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });

    const firstResult = queue.handleAck({
      id: '789',
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: AckMessageTypeEnum.MsgReadAck,
        id: '789',
        status: 'READ',
      },
      timestamp: 6_000,
    });

    expect(firstResult.handled).toBe(false);

    const replayedEvents = queue.bindServerMessageId('temp-123', '789');
    expect(replayedEvents).toHaveLength(1);
    expect(replayedEvents[0]).toEqual({
      conversationId: 'conv-456',
      messageId: '789',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Read,
      timestamp: expect.any(Number),
    });
    expect(queue.findByTempId('temp-123')).toBeUndefined();
  });

  it('应将 DELIVER_FAIL 状态回调映射为 failed，并透传错误信息', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
    });
    queue.bindServerMessageId('temp-123', '789');

    const result = queue.handleAck({
      id: '789',
      ptype: PacketMessageTypeEnum.Ack,
      body: {
        type: AckMessageTypeEnum.MsgReadAck,
        id: '789',
        status: 'DELIVER_FAIL',
        errorInfo: 'supplier timeout',
      },
      timestamp: 7_000,
    });

    expect(result.handled).toBe(true);
    expect(result.statusEvent).toEqual({
      conversationId: 'conv-456',
      messageId: '789',
      tempId: 'temp-123',
      channelType: undefined,
      status: MessageStatusEnum.Failed,
      error: 'supplier timeout',
      timestamp: expect.any(Number),
    });
    expect(queue.findByTempId('temp-123')).toBeUndefined();
  });

  it('应返回超时的 outgoing 与 receipt 项', () => {
    queue.enqueue({
      requestId: 'req-123',
      tempId: 'temp-123',
      conversationId: 'conv-456',
      timeout: 10,
    });
    queue.enqueueReceiptAck({
      ackRequestId: 'read-ack-1',
      conversationId: 'conv-456',
      targetMessageId: 'msg-123',
      targetStatus: MessageStatusEnum.Read,
      timeout: 10,
    });

    const outgoing = queue.findByTempId('temp-123');
    const receipt = queue.findById('read-ack-1');

    if (outgoing) {
      outgoing.timeoutAt = Date.now() - 1;
    }
    if (receipt && 'ackRequestId' in receipt) {
      receipt.timeoutAt = Date.now() - 1;
    }

    const timedOutItems = queue.getTimedOutItems();
    expect(timedOutItems).toHaveLength(2);
  });
});
