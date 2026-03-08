import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type {
  IMessageService,
  MessageReceivedEvent,
  MessageStatusUpdatedEvent,
} from '@/services/message.service';
import { resetChatStore, useChatStore } from '@/store';
import { useUnreadSync } from './use-unread-sync.hook';

let messageCallback: ((event: MessageReceivedEvent) => void) | undefined;

const mockConversationService: IConversationService = {
  list: vi.fn().mockResolvedValue([]),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockMessageService: IMessageService = {
  list: vi.fn(),
  send: vi.fn(),
  markAsRead: vi.fn(),
  subscribeToMessages: vi.fn((callback) => {
    messageCallback = callback;
    return vi.fn();
  }),
  subscribeToMessageStatus: vi.fn(
    (_callback: (event: MessageStatusUpdatedEvent) => void) => vi.fn(),
  ),
  sendAttachment: vi.fn(),
  sendAudio: vi.fn(),
};

function createMessage(
  id: string,
  overrides?: Partial<StandardMessage>,
): StandardMessage {
  return {
    id,
    conversationId: 'conv-1',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status: MessageStatusEnum.Sent,
    timestamp: 1_770_000_003_000,
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    sender: { app: 'customer-app', pin: '13800000000' },
    receiver: { app: 'agent-app', pin: 'agent-1' },
    ...overrides,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={mockMessageService}
          templateService={null as never}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useUnreadSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChatStore();
    messageCallback = undefined;
  });

  it('收到陌生会话的新消息时应同步消息缓存、创建临时会话并累加未读', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    const message = createMessage('msg-new', {
      conversationId: 'conv-new',
      content: { text: '来自陌生会话的新消息' },
      metadata: {
        senderName: '陌生客户',
      },
    });

    act(() => {
      messageCallback?.({
        conversationId: 'conv-new',
        message,
      });
    });

    const conversations = queryClient.getQueryData<Conversation[]>(
      queryKeys.conversations.list(),
    );
    const messages = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-new', ChannelTypeEnum.WhatsApp));

    expect(conversations?.[0]).toMatchObject({
      id: 'conv-new',
      lastMessage: '来自陌生会话的新消息',
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      status: 'active',
      user: {
        id: '13800000000',
        name: '陌生客户',
        status: AgentStatusEnum.Offline,
      },
    });
    expect(messages?.pages[0]?.items).toEqual([message]);
    expect(useChatStore.getState().unread.unreadDeltaByConversation).toEqual({
      'conv-new': 1,
    });
  });

  it('重复推送同一消息时不应重复增加未读', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    const message = createMessage('msg-duplicate', {
      conversationId: 'conv-dup',
      content: { text: '重复消息' },
    });

    act(() => {
      messageCallback?.({
        conversationId: 'conv-dup',
        message,
      });
      messageCallback?.({
        conversationId: 'conv-dup',
        message,
      });
    });

    expect(useChatStore.getState().unread.unreadDeltaByConversation).toEqual({
      'conv-dup': 1,
    });
  });
});
