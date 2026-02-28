import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { MessageActions } from './MessageActions';

const retryMutationState = {
  mutate: vi.fn(),
  isPending: false,
  variables: undefined as
    | { conversationId: string; offlineMessageId: string }
    | undefined,
};

const deleteMutationState = {
  mutate: vi.fn(),
  isPending: false,
  variables: undefined as
    | { conversationId: string; offlineMessageId: string }
    | undefined,
};

vi.mock('@/hooks/use-retry-message.hook', () => ({
  useRetryMessage: () => retryMutationState,
}));

vi.mock('@/hooks/use-delete-failed-message.hook', () => ({
  useDeleteFailedMessage: () => deleteMutationState,
}));

vi.mock('@/providers/I18n.provider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function createFailedMessage(offlineMessageId: string): StandardMessage {
  return {
    id: `msg-${offlineMessageId}`,
    tempId: `temp-${offlineMessageId}`,
    direction: MessageDirectionEnum.Outgoing,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Failed,
    timestamp: Date.now(),
    type: MessageTypeEnum.Text,
    content: { text: 'failed message' },
    sender: { app: 'sender-app', pin: 'sender-pin' },
    receiver: { app: 'receiver-app', pin: 'receiver-pin' },
    _offlineMessageId: offlineMessageId,
    _source: 'local',
  };
}

describe('MessageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retryMutationState.isPending = false;
    retryMutationState.variables = undefined;
    deleteMutationState.isPending = false;
    deleteMutationState.variables = undefined;
  });

  it('当前消息未处于重试中时，Retry 按钮应可点击', () => {
    retryMutationState.isPending = true;
    retryMutationState.variables = {
      conversationId: 'conv-1',
      offlineMessageId: 'offline-other',
    };

    render(
      <MessageActions
        message={createFailedMessage('offline-1')}
        conversationId="conv-1"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'message.retry' }),
    ).not.toBeDisabled();
  });

  it('当前消息重试中时，Retry 按钮应禁用', () => {
    retryMutationState.isPending = true;
    retryMutationState.variables = {
      conversationId: 'conv-1',
      offlineMessageId: 'offline-1',
    };

    render(
      <MessageActions
        message={createFailedMessage('offline-1')}
        conversationId="conv-1"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'message.retry' }),
    ).toBeDisabled();
  });

  it('点击 Retry 按钮应触发重试 mutation', () => {
    render(
      <MessageActions
        message={createFailedMessage('offline-1')}
        conversationId="conv-1"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'message.retry' }));

    expect(retryMutationState.mutate).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      offlineMessageId: 'offline-1',
    });
  });
});
