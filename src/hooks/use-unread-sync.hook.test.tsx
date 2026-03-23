import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
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
import type {
  IConversationService,
  UnreadCountResult,
} from '@/services/core/conversation.service';
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
    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};
    const messages = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-new', ChannelTypeEnum.WhatsApp));

    expect(conversations[0]).toMatchObject({
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
    expect(deltaByConversation['conv-new']).toBe(1);
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBe(1);
    expect(messages?.pages[0]?.items).toEqual([message]);
  });

  it('收到 imPushStatus=offline 的离线推送消息时不应增加未读', () => {
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

    const message = createMessage('msg-offline', {
      conversationId: 'conv-offline',
      metadata: {
        imPushStatus: 'offline',
      },
      content: { text: '离线推送消息' },
    });

    act(() => {
      messageCallback?.({
        conversationId: 'conv-offline',
        message,
      });
    });

    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    expect(deltaByConversation['conv-offline']).toBeUndefined();
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBeUndefined();

    const messages = queryClient.getQueryData<{
      pages: Array<{ items: StandardMessage[] }>;
    }>(queryKeys.messages.list('conv-offline', ChannelTypeEnum.WhatsApp));

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
    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    expect(conversations[0]?.unreadCount).toBe(0);
    expect(deltaByConversation['conv-dup']).toBe(1);
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBe(1);
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
    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    expect(conversations[0]).toMatchObject({
      id: 'conv-active',
      lastMessage: '当前会话新消息',
      unreadCount: 0,
    });
    expect(deltaByConversation['conv-active']).toBe(1);
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBe(1);
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
    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    // base 不变，delta -1（3 + (-1) = 2）
    expect(conversations[0]?.unreadCount).toBe(3);
    expect(deltaByConversation['conv-status']).toBe(-1);
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBe(-1);
  });

  it('Read ACK 不应让会话未读基线+增量变负（base=2, delta=+2 时最多减 4）', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const conversationId = 'conv-read-limit';

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: conversationId,
        user: {
          id: 'limit-user',
          name: '限额用户',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '历史消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 2,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    // socket 新消息：delta +2（有效未读应从 2 变为 4）
    act(() => {
      messageCallback?.({
        conversationId,
        message: createMessage('msg-in-1', { conversationId }),
      });
      messageCallback?.({
        conversationId,
        message: createMessage('msg-in-2', { conversationId }),
      });
    });

    const deltaBeforeRead =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const channelDeltaBeforeRead =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    expect(deltaBeforeRead[conversationId]).toBe(2);
    expect(channelDeltaBeforeRead[ChannelTypeEnum.WhatsApp]).toBe(2);

    // 连续多次 Read ACK：总共只能减到 0（不能超过 4）
    act(() => {
      for (let i = 0; i < 5; i++) {
        statusCallback?.({
          conversationId,
          messageId: `msg-read-${i}`,
          tempId: undefined,
          channelType: ChannelTypeEnum.WhatsApp,
          status: MessageStatusEnum.Read,
          timestamp: 1_770_000_100_000 + i,
        });
      }
    });

    const deltaAfterRead =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const channelDeltaAfterRead =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    // base=2，最终有效未读应为 0 => delta= -2；额外的 Read ACK 也不应继续减
    expect(deltaAfterRead[conversationId]).toBe(-2);
    expect(channelDeltaAfterRead[ChannelTypeEnum.WhatsApp]).toBe(-2);
  });

  it('Read ACK 不应让会话未读变负（base=0, delta=+5 时最多减 5）', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const conversationId = 'conv-read-limit-zero';

    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: conversationId,
        user: {
          id: 'limit-zero-user',
          name: '零未读用户',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '历史消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    // socket 新消息：delta +5（有效未读应从 0 变为 5）
    act(() => {
      for (let i = 0; i < 5; i++) {
        messageCallback?.({
          conversationId,
          message: createMessage(`msg-in-${i}`, { conversationId }),
        });
      }
    });

    const deltaBeforeRead =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};

    expect(deltaBeforeRead[conversationId]).toBe(5);

    // 连续 Read ACK：最多只能减到 0（不能超过 5）
    act(() => {
      for (let i = 0; i < 6; i++) {
        statusCallback?.({
          conversationId,
          messageId: `msg-read-${i}`,
          tempId: undefined,
          channelType: ChannelTypeEnum.WhatsApp,
          status: MessageStatusEnum.Read,
          timestamp: 1_770_000_200_000 + i,
        });
      }
    });

    const deltaAfterRead =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};

    expect(deltaAfterRead[conversationId]).toBeUndefined();
  });

  it('Read ACK 应使用渠道基线扣减：当会话 unreadCount=0 但渠道基线>0', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // 渠道基线未读来自服务端：WhatsApp 未读为 2
    queryClient.setQueryData<UnreadCountResult>(queryKeys.conversations.unread(), {
      [ChannelTypeEnum.WhatsApp]: 2,
    });

    // 会话缓存 unreadCount 可能因为离线补发/时序问题为 0
    seedConversationCache(queryClient, ChannelTypeEnum.WhatsApp, [
      {
        id: 'conv-offline-unread-mismatch',
        user: {
          id: 'offline-user',
          name: '离线用户',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '历史消息',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
      },
    ]);

    renderHook(() => useUnreadSync(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      for (let i = 0; i < 2; i++) {
        statusCallback?.({
          conversationId: 'conv-offline-unread-mismatch',
          messageId: `msg-read-${i}`,
          tempId: undefined,
          channelType: ChannelTypeEnum.WhatsApp,
          status: MessageStatusEnum.Read,
          timestamp: 1_770_000_300_000 + i,
        });
      }
    });

    const deltaByConversation =
      queryClient.getQueryData<Record<string, number>>(
        queryKeys.conversations.unreadDeltas.conversation(),
      ) ?? {};
    const deltaByChannel =
      queryClient.getQueryData<UnreadCountResult>(
        queryKeys.conversations.unreadDeltas.channel(),
      ) ?? {};

    // 会话维度 base=0 时不应继续扣减 delta
    expect(deltaByConversation['conv-offline-unread-mismatch']).toBe(
      undefined,
    );

    // 渠道维度应从 base(2) 通过 delta(-2) 归零
    expect(deltaByChannel[ChannelTypeEnum.WhatsApp]).toBe(-2);
  });
});
