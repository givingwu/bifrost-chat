import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { MessageList } from './MessageList';

vi.mock('@/hooks/use-mark-as-read.hook', () => ({
  useMarkAsRead: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./MessageRendererFactory', () => ({
  MessageRendererFactory: ({ message }: { message: StandardMessage }) => {
    const content = message.content as { text?: unknown };

    return (
      <div data-testid="message-row">
        {typeof content.text === 'string' ? content.text : ''}
      </div>
    );
  },
}));

function timestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): number {
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

function createMessage(
  id: string,
  text: string,
  messageTimestamp: number,
): StandardMessage {
  return {
    id,
    conversationId: 'conv-date-separator',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp: messageTimestamp,
    type: MessageTypeEnum.Text,
    content: { text },
    sender: { app: 'sender-app', pin: 'sender-pin' },
    receiver: { app: 'receiver-app', pin: 'receiver-pin' },
  };
}

describe('MessageList date separator', () => {
  it('跨天消息应在每天第一条消息前展示日期分隔符', () => {
    const messages = [
      createMessage('msg-1', '第一天第一条', timestamp(2026, 6, 10, 8, 30, 15)),
      createMessage('msg-2', '第一天第二条', timestamp(2026, 6, 10, 9, 0, 0)),
      createMessage('msg-3', '第二天第一条', timestamp(2026, 6, 11, 9, 5, 6)),
    ];

    const { container } = render(
      <MessageList messages={messages} enableVirtualization={false} />,
    );

    const separators = container.querySelectorAll(
      '[data-component="message-date-separator"]',
    );

    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveTextContent('2026-06-10 08:30:15');
    expect(separators[1]).toHaveTextContent('2026-06-11 09:05:06');
  });

  it('同一天多条消息只应展示一个日期分隔符', () => {
    const messages = [
      createMessage('msg-1', '同一天第一条', timestamp(2026, 6, 10, 8, 30, 15)),
      createMessage(
        'msg-2',
        '同一天第二条',
        timestamp(2026, 6, 10, 18, 45, 30),
      ),
    ];

    const { container } = render(
      <MessageList messages={messages} enableVirtualization={false} />,
    );

    expect(
      container.querySelectorAll('[data-component="message-date-separator"]'),
    ).toHaveLength(1);
    expect(screen.getByText('2026-06-10 08:30:15')).toBeInTheDocument();
  });
});
