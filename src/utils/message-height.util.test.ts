import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  clearCachedMessageHeight,
  estimateMessageHeight,
  getCachedMessageHeight,
  getMessageHeightCacheKey,
  setCachedMessageHeight,
} from './message-height.util';

function createMockMessage(
  overrides: Partial<StandardMessage> = {},
): StandardMessage {
  return {
    id: overrides.id ?? 'msg-default',
    conversationId: overrides.conversationId ?? 'chat-default',
    direction: overrides.direction ?? MessageDirectionEnum.Incoming,
    channelType: overrides.channelType ?? ChannelTypeEnum.WhatsApp,
    status: overrides.status ?? MessageStatusEnum.Sent,
    timestamp: overrides.timestamp ?? Date.now(),
    type: overrides.type ?? MessageTypeEnum.Text,
    content: overrides.content ?? { text: 'hello' },
    tempId: overrides.tempId,
    sender: overrides.sender ?? { app: 'sender-app', pin: 'sender-pin' },
    receiver: overrides.receiver ?? {
      app: 'receiver-app',
      pin: 'receiver-pin',
    },
  };
}

describe('message-height.util', () => {
  it('should prefer tempId as cache key', () => {
    const message = createMockMessage({
      id: 'msg-1',
      tempId: 'temp-1',
    });

    expect(getMessageHeightCacheKey(message)).toBe('temp:temp-1');
  });

  it('should reuse cached height across different message object refs', () => {
    const firstMessage = createMockMessage({
      id: 'msg-1',
      tempId: 'temp-1',
    });
    const secondMessage = createMockMessage({
      id: 'msg-2',
      tempId: 'temp-1',
    });

    setCachedMessageHeight(firstMessage, 142);

    expect(getCachedMessageHeight(secondMessage)).toBe(142);

    clearCachedMessageHeight(firstMessage);
  });

  it('should clear cached height by stable cache key', () => {
    const firstMessage = createMockMessage({
      id: 'msg-3',
      tempId: 'temp-3',
    });
    const secondMessage = createMockMessage({
      id: 'msg-4',
      tempId: 'temp-3',
    });

    setCachedMessageHeight(firstMessage, 166);
    clearCachedMessageHeight(secondMessage);

    expect(getCachedMessageHeight(firstMessage)).toBeUndefined();
  });

  it('should estimate text message height within bounds', () => {
    const shortTextMessage = createMockMessage({
      content: { text: 'hi' },
      type: MessageTypeEnum.Text,
    });
    const longTextMessage = createMockMessage({
      content: { text: 'a'.repeat(3000) },
      type: MessageTypeEnum.Text,
    });

    expect(estimateMessageHeight(shortTextMessage)).toBe(64.75);
    expect(estimateMessageHeight(longTextMessage)).toBe(200);
  });
});
