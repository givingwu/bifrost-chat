import { describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { MessageBuilder } from './message-builder.util';

describe('MessageBuilder', () => {
  it('should build a valid text message', () => {
    const message = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelTypeEnum.SMS,
    });

    expect(message.content).toEqual({ text: 'Hello' });
    expect(message.direction).toBe(MessageDirectionEnum.Outgoing);
    expect(message.status).toBe(MessageStatusEnum.Created);
    expect(message.type).toBe(MessageTypeEnum.Text);
    expect(message.sender?.id).toBe('agent-1');
    expect(message.receiver?.id).toBe('user-1');
    expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    expect(message.tempId).toMatch(/^temp_\d+_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const message1 = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelTypeEnum.SMS,
    });
    const message2 = MessageBuilder.buildTextMessage('World', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelTypeEnum.SMS,
    });

    expect(message1.id).not.toBe(message2.id);
    expect(message1.tempId).not.toBe(message2.tempId);
  });

  it('should use custom sender and receiver when provided', () => {
    const customSender = {
      id: 'custom-agent',
      app: 'custom-app',
      clientType: 'mobile',
      channelType: ChannelTypeEnum.WhatsApp,
    };
    const customReceiver = {
      id: 'custom-user',
      channelType: ChannelTypeEnum.WhatsApp,
    };

    const message = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelTypeEnum.WhatsApp,
      sender: customSender,
      receiver: customReceiver,
    });

    expect(message.sender).toEqual(customSender);
    expect(message.receiver).toEqual(customReceiver);
  });

  it('should use custom message type when provided', () => {
    const message = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelTypeEnum.SMS,
      type: MessageTypeEnum.Image,
    });

    expect(message.type).toBe(MessageTypeEnum.Image);
  });
});
