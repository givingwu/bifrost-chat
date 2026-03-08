import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { InfiniteMessageList } from './InfiniteMessageList';

const useMessagesMock = vi.fn();
const messageListSpy = vi.fn();

vi.mock('@/hooks/use-messages.hook', () => ({
  useMessages: (...args: unknown[]) => useMessagesMock(...args),
}));

vi.mock('./MessageList', () => ({
  MessageList: (props: unknown) => {
    messageListSpy(props);
    return <div data-testid="mock-message-list" />;
  },
}));

function createMessage(
  id: string,
  timestamp: number,
  overrides?: Partial<StandardMessage>,
): StandardMessage {
  return {
    id,
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp,
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    sender: { app: 'sender-app', pin: 'sender-pin' },
    receiver: { app: 'receiver-app', pin: 'receiver-pin' },
    ...overrides,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('InfiniteMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMessagesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      refetch: vi.fn(),
    });
  });

  it('应对跨页重复 MID 做幂等去重后再渲染', () => {
    useMessagesMock.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              createMessage('mid-1', 2000, {
                content: { text: 'same-mid-message' },
                tempId: 'temp-mid-1',
              }),
              createMessage('mid-2', 3000),
            ],
          },
          {
            items: [
              createMessage('mid-1', 2000, {
                content: { text: 'same-mid-message' },
              }),
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(
      <InfiniteMessageList
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
      />,
      {
        wrapper: createWrapper(new QueryClient()),
      },
    );

    expect(screen.getByTestId('mock-message-list')).toBeInTheDocument();
    expect(messageListSpy).toHaveBeenCalled();

    const latestCall = messageListSpy.mock.calls.at(-1)?.[0] as {
      messages: StandardMessage[];
    };

    expect(latestCall.messages).toHaveLength(2);
    expect(latestCall.messages.map((message) => message.id)).toEqual([
      'mid-1',
      'mid-2',
    ]);
    expect(latestCall.messages[0]?.tempId).toBe('temp-mid-1');
  });

  it('打开会话时应只保留最新页缓存', async () => {
    const queryClient = new QueryClient();
    const queryKey = queryKeys.messages.list(
      'conv-1',
      ChannelTypeEnum.WhatsApp,
    );

    queryClient.setQueryData(queryKey, {
      pages: [
        {
          items: [createMessage('latest-mid', 3000)],
        },
        {
          items: [createMessage('older-mid', 2000)],
        },
      ],
      pageParams: [1, 2],
    });

    useMessagesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(
      <InfiniteMessageList
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
      />,
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => {
      expect(
        queryClient.getQueryData<{
          pages: Array<{ items: StandardMessage[] }>;
          pageParams: unknown[];
        }>(queryKey),
      ).toEqual({
        pages: [
          {
            items: [createMessage('latest-mid', 3000)],
          },
        ],
        pageParams: [1],
      });
    });
  });

  it('打开会话时不应自动加载历史消息', () => {
    const fetchNextPage = vi.fn();

    useMessagesMock.mockReturnValue({
      data: {
        pages: [
          {
            items: [createMessage('mid-1', 2000)],
          },
        ],
      },
      isLoading: false,
      error: null,
      hasNextPage: true,
      fetchNextPage,
      isFetchingNextPage: false,
      refetch: vi.fn(),
    });

    render(
      <InfiniteMessageList
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
      />,
      {
        wrapper: createWrapper(new QueryClient()),
      },
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('加载失败时应显示重试按钮并支持重新拉取', () => {
    const refetch = vi.fn();

    useMessagesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('load failed'),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      refetch,
    });

    render(
      <InfiniteMessageList
        conversationId="conv-1"
        currentChannel={ChannelTypeEnum.WhatsApp}
      />,
      {
        wrapper: createWrapper(new QueryClient()),
      },
    );

    expect(screen.getByText('加载失败，请重试')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
