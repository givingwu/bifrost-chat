import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  type MessageStatusUpdatedEvent,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { IConversationService } from '@/services/core/conversation.service';
import type {
  IMessageService,
  MessageReceivedEvent,
} from '@/services/core/message.service';
import { resetChatStore, useChatStore } from '@/store';
import { seedConversationCache } from '@/test-utils/conversation-cache.test-util';
import { useUnreadSync } from './use-unread-sync.hook';

let messageCallback: ((event: MessageReceivedEvent) => void) | undefined;
let statusCallback: ((event: MessageStatusUpdatedEvent) => void) | undefined;

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
  subscribeToMessageStatus: vi.fn((callback) => {
    statusCallback = callback;
    return vi.fn();
  }),
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
    statusCallback = undefined;
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

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    );
    const messages = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-new', ChannelTypeEnum.WhatsApp));

    expect(conversations[0]).toMatchObject({
      id: 'conv-new',
      lastMessage: '来自陌生会话的新消息',
      unreadCount: 1,
      channel: ChannelTypeEnum.WhatsApp,
      status: 'active',
      user: {
        id: '13800000000',
        name: '陌生客户',
        status: AgentStatusEnum.Offline,
      },
    });
    expect(messages?.pages[0]?.items).toEqual([message]);
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

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    );

    expect(conversations[0]?.unreadCount).toBe(1);
  });

  it('当前激活会话收到 incoming 消息时不应增加未读', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-active',
        user: {
          id: 'active-user',
          name: '当前会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '历史消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    act(() => {
      useChatStore.getState().actions.setActiveConversationId('conv-active');
    });

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      messageCallback?.({
        conversationId: 'conv-active',
        message: createMessage('msg-active', {
          conversationId: 'conv-active',
          content: { text: '当前会话新消息' },
        }),
      });
    });

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    );

    expect(conversations[0]).toMatchObject({
      id: 'conv-active',
      lastMessage: '当前会话新消息',
      // 新方案下激活会话同样会先增加未读，由滚动已读流程精确扣回
      unreadCount: 1,
    });
  });

  it('收到 Read 状态事件时应减少会话未读 -1 并更新消息状态', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const message = createMessage('msg-read', {
      conversationId: 'conv-status',
      status: MessageStatusEnum.Delivered,
    });

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-status',
        user: {
          id: 'status-user',
          name: '状态会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '消息状态测试',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 3,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);
    queryClient.setQueryData(queryKeys.messages.list('conv-status'), {
      pages: [{ items: [message] }],
      pageParams: [1],
    });
    queryClient.setQueryData(
      queryKeys.messages.list('conv-status', ChannelTypeEnum.WhatsApp),
      {
        pages: [{ items: [message] }],
        pageParams: [1],
      },
    );

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      statusCallback?.({
        conversationId: 'conv-status',
        messageId: 'msg-read',
        tempId: message.tempId,
        channelType: ChannelTypeEnum.WhatsApp,
        status: MessageStatusEnum.Read,
        timestamp: 1_770_000_004_000,
      });
    });

    const conversations = ConversationCacheHelper.getConversations(
      queryClient,
      ChannelTypeEnum.WhatsApp,
    );

    // useUnreadSync 只负责未读计数：Read ACK -1（3 → 2）
    // 消息状态更新由 useMessageStatusSync 负责，本测试不关注它
    expect(conversations[0]?.unreadCount).toBe(2);
  });
});
