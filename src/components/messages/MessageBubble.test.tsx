import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { PacketSenderTypeEnum } from '@/interfaces/protocol.interface';
import { MessageBubble } from './MessageBubble';

vi.mock('@/hooks/use-in-viewport.hook', () => ({
  useInViewport: () => [false],
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'message.channelAccountTail') {
        return `发送号码 ${String(params?.tail)}`;
      }
      if (key === 'message.chatbot') {
        return 'Chatbot';
      }
      return key;
    },
  }),
}));

vi.mock('./MessageContentRenderer', () => ({
  MessageContentRenderer: () => <div data-testid="mock-content" />,
}));

vi.mock('./MessageTimestamp', () => ({
  MessageTimestamp: () => <div data-testid="mock-timestamp" />,
}));

vi.mock('./StatusIndicator', () => ({
  StatusIndicator: () => <div data-testid="mock-status" />,
}));

vi.mock('./MessageActions', () => ({
  MessageActions: () => null,
}));

function createMessage(overrides: Partial<StandardMessage>): StandardMessage {
  return {
    id: 'msg-1',
    tempId: 'tmp-1',
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.SMS,
    status: MessageStatusEnum.Sent,
    timestamp: Date.now(),
    type: MessageTypeEnum.Text,
    content: { text: 'hello' },
    sender: { app: 'sender-app', pin: 'sender-pin' },
    receiver: { app: 'receiver-app', pin: 'receiver-pin' },
    ...overrides,
  };
}

describe('MessageBubble', () => {
  function expectElementsInOrder(elements: HTMLElement[]) {
    for (let index = 0; index < elements.length - 1; index += 1) {
      const current = elements[index];
      const next = elements[index + 1];

      expect(
        current.compareDocumentPosition(next) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  }

  it('服务端 ACK 导致失败时，应展示错误文案（即使没有 _offlineMessageId）', () => {
    render(
      <MessageBubble
        message={createMessage({
          status: MessageStatusEnum.Failed,
          error: 'SMS submit failed',
          _source: 'server',
        })}
        conversationId="conv-1"
      />,
    );

    expect(screen.getByText('SMS submit failed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'message.retry' })).toBeNull();
  });

  it('有 channelAccount 时应展示发送号码尾号', () => {
    render(
      <MessageBubble
        message={createMessage({
          metadata: {
            channelAccount: '628123456789',
          },
        })}
      />,
    );

    expect(screen.getByText('发送号码 6789')).toBeInTheDocument();
  });

  it('没有 channelAccount 时不应展示发送号码区域', () => {
    render(<MessageBubble message={createMessage({})} />);

    expect(screen.queryByText(/^发送号码/)).toBeNull();
  });

  it('senderType 为 Chatbot 枚举的外发消息应展示 Chatbot 标识', () => {
    render(
      <MessageBubble
        message={createMessage({
          direction: MessageDirectionEnum.Outgoing,
          metadata: {
            senderType: PacketSenderTypeEnum.Chatbot,
          },
        })}
      />,
    );

    expect(screen.getByText('Chatbot')).toBeInTheDocument();
  });

  it('senderType 为 Chatbot 枚举的客户消息不应展示 Chatbot 标识', () => {
    render(
      <MessageBubble
        message={createMessage({
          direction: MessageDirectionEnum.Incoming,
          metadata: {
            senderType: PacketSenderTypeEnum.Chatbot,
          },
        })}
      />,
    );

    expect(screen.queryByText('Chatbot')).toBeNull();
  });

  it('下行消息补充信息应与上行消息镜像排序', () => {
    render(
      <MessageBubble
        message={createMessage({
          direction: MessageDirectionEnum.Outgoing,
          metadata: {
            channelAccount: '628123456789',
            senderType: PacketSenderTypeEnum.Chatbot,
          },
        })}
      />,
    );

    expectElementsInOrder([
      screen.getByText('发送号码 6789'),
      screen.getByText('Chatbot'),
      screen.getByTestId('mock-status'),
      screen.getByTestId('mock-timestamp'),
    ]);
  });

  it('上行消息补充信息应按时间、状态、发送号码排序', () => {
    render(
      <MessageBubble
        message={createMessage({
          direction: MessageDirectionEnum.Incoming,
          metadata: {
            channelAccount: '628123456789',
          },
        })}
      />,
    );

    expectElementsInOrder([
      screen.getByTestId('mock-timestamp'),
      screen.getByTestId('mock-status'),
      screen.getByText('发送号码 6789'),
    ]);
  });
});
