import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  ClientTypeEnum,
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { MessageBuilder } from './message-builder.service';

describe('MessageBuilder', () => {
  it('should build a valid text message', () => {
    const message = MessageBuilder.buildTextMessage('Hello', {
      fromPin: 'agent-1',
      toPin: 'user-1',
      channelType: ChannelTypeEnum.SMS,
      conversationId: 'conv-1',
    });

    expect(message.content).toEqual({ text: 'Hello' });
    expect(message.direction).toBe(MessageDirectionEnum.Outgoing);
    expect(message.status).toBe(MessageStatusEnum.Created);
    expect(message.type).toBe(MessageTypeEnum.Text);
    expect(message.sender?.pin).toBe('agent-1');
    expect(message.receiver?.pin).toBe('user-1');
    expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    expect(message.tempId).toMatch(/^chat_\d+_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const message1 = MessageBuilder.buildTextMessage('Hello', {
      fromPin: 'agent-1',
      toPin: 'user-1',
      channelType: ChannelTypeEnum.SMS,
      conversationId: 'conv-1',
    });
    const message2 = MessageBuilder.buildTextMessage('World', {
      fromPin: 'agent-1',
      toPin: 'user-1',
      channelType: ChannelTypeEnum.SMS,
      conversationId: 'conv-1',
    });

    expect(message1.id).not.toBe(message2.id);
    expect(message1.tempId).not.toBe(message2.tempId);
  });

  it('should use custom sender and receiver when provided', () => {
    const customSender = {
      app: 'custom-app',
      pin: 'custom-agent',
      clientType: ClientTypeEnum.Android,
      channelType: ChannelTypeEnum.WhatsApp,
    };
    const customReceiver = {
      app: 'custom-app',
      pin: 'custom-user',
      channelType: ChannelTypeEnum.WhatsApp,
    };

    const message = MessageBuilder.buildTextMessage('Hello', {
      fromPin: 'agent-1',
      toPin: 'user-1',
      channelType: ChannelTypeEnum.WhatsApp,
      sender: customSender,
      receiver: customReceiver,
      conversationId: 'conv-1',
    });

    expect(message.sender).toEqual(customSender);
    expect(message.receiver).toEqual(customReceiver);
  });

  it('should use custom message type when provided', () => {
    const message = MessageBuilder.buildTextMessage('Hello', {
      fromPin: 'agent-1',
      toPin: 'user-1',
      channelType: ChannelTypeEnum.SMS,
      type: MessageTypeEnum.Image,
      conversationId: 'conv-1',
    });

    expect(message.type).toBe(MessageTypeEnum.Text);
  });
});
