import { describe, expect, it } from 'vitest';
import { ChannelType } from '@/interfaces/channel.interface';
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/interfaces/message.interface';
import { MessageBuilder } from './message-builder.util';

describe('MessageBuilder', () => {
  it('should build a valid text message', () => {
    const message = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelType.SMS,
    });

    expect(message.content).toEqual({ text: 'Hello' });
    expect(message.direction).toBe(MessageDirection.Outgoing);
    expect(message.status).toBe(MessageStatus.Created);
    expect(message.type).toBe(MessageType.Text);
    expect(message.sender?.id).toBe('agent-1');
    expect(message.receiver?.id).toBe('user-1');
    expect(message.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    expect(message.tempId).toMatch(/^temp_\d+_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const message1 = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelType.SMS,
    });
    const message2 = MessageBuilder.buildTextMessage('World', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelType.SMS,
    });

    expect(message1.id).not.toBe(message2.id);
    expect(message1.tempId).not.toBe(message2.tempId);
  });

  it('should use custom sender and receiver when provided', () => {
    const customSender = {
      id: 'custom-agent',
      app: 'custom-app',
      clientType: 'mobile',
      channelType: ChannelType.WhatsApp,
    };
    const customReceiver = {
      id: 'custom-user',
      channelType: ChannelType.WhatsApp,
    };

    const message = MessageBuilder.buildTextMessage('Hello', {
      senderId: 'agent-1',
      receiverId: 'user-1',
      channelType: ChannelType.WhatsApp,
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
      channelType: ChannelType.SMS,
      type: MessageType.Image,
    });

    expect(message.type).toBe(MessageType.Image);
  });
});
