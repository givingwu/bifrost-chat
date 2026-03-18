import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { MessageBubble } from './MessageBubble';

vi.mock('@/hooks/use-in-viewport.hook', () => ({
  useInViewport: () => [false],
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    expect(
      screen.queryByRole('button', { name: 'message.retry' }),
    ).toBeNull();
  });
});

