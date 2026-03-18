import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import {
  MessageFailureTypeEnum,
  type MessageSendResult,
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  NetworkQualityEnum,
  NetworkReachabilityEnum,
  NetworkStatusEnum,
} from '@/interfaces/network.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { messageQueue } from '@/services/messaging/message-queue.service';
import { pendingMessageTracker } from '@/services/messaging/pending-message-tracker.service';
import type { CurrentUser } from '@/store';
import { useSendMessage } from './use-send-message.hook';

// Mock useStrategy
const mockCurrentUser: CurrentUser = {
  app: 'test-app',
  pin: 'test-agent-123',
  status: AgentStatusEnum.Online,
};

let mockNetwork = {
  status: NetworkStatusEnum.Connected,
  reachability: NetworkReachabilityEnum.Online,
  quality: NetworkQualityEnum.Good,
  enableStatusIndicator: true,
};

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();

  return {
    ...actual,
    useStrategy: () => ({
      activeChannel: 'whatsapp' as const,
      allowedChannels: ['whatsapp' as const],
      currentUser: mockCurrentUser,
    }),
    useActiveConversationId: () => 'conv-1',
    useNetwork: () => mockNetwork,
  };
});

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockTemplateService: ITemplateService = {
  list: vi.fn(),
  preview: vi.fn(),
};

const mockMessageService: IMessageService = {
  list: vi.fn(),
  send: vi.fn(),
  markAsRead: vi.fn(),
  subscribeToMessages: vi.fn(() => () => {}),
  subscribeToMessageStatus: vi.fn(() => () => {}),
  sendAttachment: vi.fn(),
  sendAudio: vi.fn(),
};

function createTestWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={mockMessageService}
          templateService={mockTemplateService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

// useStrategy mock 的 activeChannel 为 whatsapp，需与 query key 一致
const ACTIVE_CHANNEL = 'whatsapp';

function getMessages(queryClient: QueryClient, conversationId: string) {
  const data = queryClient.getQueryData(
    queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
  ) as
    | {
        pages: Array<{ items: StandardMessage[] }>;
      }
    | undefined;
  return data?.pages.flatMap((page) => page.items) ?? [];
}

function seedConversations(
  queryClient: QueryClient,
  conversations: Conversation[],
) {
  queryClient.setQueryData(queryKeys.conversations.list(ACTIVE_CHANNEL), {
    pageParams: [1],
    pages: [conversations],
  });
}

function getConversationIds(queryClient: QueryClient) {
  const data = queryClient.getQueryData(queryKeys.conversations.list(ACTIVE_CHANNEL)) as
    | {
        pages: Conversation[][];
      }
    | undefined;
  return data?.pages.flat().map((conversation) => conversation.id) ?? [];
}

function getConversationById(queryClient: QueryClient, conversationId: string) {
  const data = queryClient.getQueryData(queryKeys.conversations.list(ACTIVE_CHANNEL)) as
    | {
        pages: Conversation[][];
      }
    | undefined;
  return data?.pages.flat().find((conversation) => conversation.id === conversationId);
}

describe('useSendMessage Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingMessageTracker.clear();
    messageQueue.clear();
    mockNetwork = {
      status: NetworkStatusEnum.Connected,
      reachability: NetworkReachabilityEnum.Online,
      quality: NetworkQualityEnum.Good,
      enableStatusIndicator: true,
    };
    vi.mocked(mockConversationService.list).mockResolvedValue([]);
  });

  afterEach(() => {
    pendingMessageTracker.clear();
    messageQueue.clear();
  });

  it('应在发送成功后回填服务端 messageId 并更新状态', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-mobile';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    let resolveSend:
      | ((value: {
          tempId: string;
          messageId?: string;
          status: MessageStatusEnum;
          error?: string;
          retryCount?: number;
          retryable?: boolean;
        }) => void)
      | null = null;

    vi.mocked(mockMessageService.send).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        content: 'hello from mobile',
        options: { metadata: { clientType: 'mobile' } },
      });
    });

    await waitFor(() => {
      const optimisticMessages = getMessages(queryClient, conversationId);
      expect(optimisticMessages).toHaveLength(1);
      expect(optimisticMessages[0]?.status).toBe(MessageStatusEnum.Sending);
      expect(
        messageQueue.findByTempId(optimisticMessages[0]?.tempId ?? ''),
      ).toBeDefined();
    });

    const optimisticTempId = getMessages(queryClient, conversationId)[0]
      ?.tempId;
    const optimisticId = getMessages(queryClient, conversationId)[0]?.id;

    expect(optimisticTempId).toBeTruthy();
    expect(optimisticId).toBeTruthy();

    act(() => {
      resolveSend?.({
        tempId: 'server-temp-id',
        messageId: 'mobile-message-id-1001',
        status: MessageStatusEnum.Sent,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const sentMessage = getMessages(queryClient, conversationId)[0];
    expect(sentMessage?.id).toBe('mobile-message-id-1001');
    expect(sentMessage?.tempId).toBe(optimisticTempId);
    expect(sentMessage?.status).toBe(MessageStatusEnum.Sent);
    expect(sentMessage?.id).not.toBe(optimisticId);
    expect(messageQueue.findByMid('mobile-message-id-1001')).toBeDefined();
    expect(mockMessageService.send).toHaveBeenCalledWith(conversationId, {
      content: 'hello from mobile',
      metadata: { clientType: 'mobile' },
      channelType: 'whatsapp',
      receiver: {
        app: 'test-app',
        pin: '',
        channelType: 'whatsapp',
        clientType: undefined,
      },
    });
  });

  it('发送成功后应更新会话摘要并将会话置顶', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const conversationA = {
      id: 'conv-a',
      user: {
        id: 'user-a',
        name: 'A',
        status: AgentStatusEnum.Online,
      },
      lastMessage: 'A old',
      lastMessageTime: new Date('2020-01-01T00:00:00.000Z').toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
    } satisfies Conversation;

    const conversationB = {
      id: 'conv-b',
      user: {
        id: 'user-b',
        name: 'B',
        status: AgentStatusEnum.Online,
      },
      lastMessage: 'B newer',
      lastMessageTime: new Date('2021-01-01T00:00:00.000Z').toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
    } satisfies Conversation;

    // 初始顺序：B 在前，A 在后
    seedConversations(queryClient, [conversationB, conversationA]);

    queryClient.setQueryData(queryKeys.messages.list('conv-a', ACTIVE_CHANNEL), {
      pages: [{ items: [] }],
      pageParams: [1],
    });

    vi.mocked(mockMessageService.send).mockResolvedValue({
      tempId: 'server-temp-id',
      messageId: 'msg-a-1',
      status: MessageStatusEnum.Sent,
    } satisfies MessageSendResult);

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: 'conv-a',
        content: 'hello A',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getConversationIds(queryClient)).toEqual(['conv-a', 'conv-b']);

    const updatedA = getConversationById(queryClient, 'conv-a');
    expect(updatedA?.lastMessage).toBe('hello A');
    expect(updatedA?.lastMessageTime).toBeTruthy();
    expect(Date.parse(updatedA?.lastMessageTime ?? '')).toBeGreaterThan(
      Date.parse(conversationB.lastMessageTime),
    );
  });

  it('应优先使用会话 metadata 中的 customerPin/customerApp 作为默认接收方', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-1';

    seedConversations(queryClient, [
      {
        id: conversationId,
        user: {
          id: 'fallback-user-id',
          name: '王五',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_000_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.WhatsApp,
        metadata: {
          customerPin: 'customer-13800000000',
          customerApp: 'fox_collect.customer',
        },
      },
    ]);

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    vi.mocked(mockMessageService.send).mockResolvedValue({
      tempId: 'server-temp-id',
      messageId: 'server-message-id',
      status: MessageStatusEnum.Sent,
    } satisfies MessageSendResult);

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId,
        content: '电催模板消息',
      });
    });

    expect(mockMessageService.send).toHaveBeenCalledWith(conversationId, {
      content: '电催模板消息',
      channelType: 'whatsapp',
      receiver: {
        app: 'fox_collect.customer',
        pin: 'customer-13800000000',
        channelType: 'whatsapp',
        clientType: undefined,
      },
    });

    const optimisticMessage = getMessages(queryClient, conversationId)[0];
    expect(optimisticMessage?.receiver).toEqual(
      expect.objectContaining({
        app: 'fox_collect.customer',
        pin: 'customer-13800000000',
      }),
    );
  });

  it('未提供离线队列时，服务返回失败状态应回滚临时消息', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-template-limit';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    let resolveSend:
      | ((value: {
          tempId: string;
          messageId?: string;
          status: MessageStatusEnum;
          error?: string;
          retryCount?: number;
          retryable?: boolean;
        }) => void)
      | null = null;

    vi.mocked(mockMessageService.send).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        content: 'template limit reached',
        options: { templateMetadata: { templateId: 'tpl-1' } },
      });
    });

    await waitFor(() => {
      const optimisticMessages = getMessages(queryClient, conversationId);
      expect(optimisticMessages).toHaveLength(1);
      expect(optimisticMessages[0]?.status).toBe(MessageStatusEnum.Sending);
    });

    act(() => {
      resolveSend?.({
        tempId: 'server-temp-id',
        status: MessageStatusEnum.Failed,
        error: 'template limit reached',
        retryable: true,
      });
    });

    await waitFor(() => {
      expect(getMessages(queryClient, conversationId)).toHaveLength(0);
    });
  });

  it('未提供离线队列时，服务返回 error 但状态非 Failed 也应回滚', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-template-error';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    let resolveSend: ((value: MessageSendResult) => void) | null = null;

    vi.mocked(mockMessageService.send).mockImplementation(
      () =>
        new Promise<MessageSendResult>((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        content: 'template error',
        options: { templateMetadata: { templateId: 'tpl-2' } },
      });
    });

    await waitFor(() => {
      const optimisticMessages = getMessages(queryClient, conversationId);
      expect(optimisticMessages).toHaveLength(1);
      expect(optimisticMessages[0]?.status).toBe(MessageStatusEnum.Sending);
    });

    act(() => {
      resolveSend?.({
        tempId: 'server-temp-id',
        status: MessageStatusEnum.Sent,
        error: 'template limit reached',
        retryable: true,
        needRollback: false,
      });
    });

    await waitFor(() => {
      expect(getMessages(queryClient, conversationId)).toHaveLength(0);
    });
  });

  it('当 status 为 Reconnecting 且 reachability 为 Online 时不应阻断发送', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-reconnecting';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    mockNetwork = {
      status: NetworkStatusEnum.Reconnecting,
      reachability: NetworkReachabilityEnum.Online,
      quality: NetworkQualityEnum.Good,
      enableStatusIndicator: true,
    };

    vi.mocked(mockMessageService.send).mockResolvedValue({
      tempId: 'server-temp-id',
      messageId: 'message-reconnecting-1',
      status: MessageStatusEnum.Sent,
    });

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId,
        content: 'reconnecting but reachable',
      });
    });

    expect(mockMessageService.send).toHaveBeenCalledWith(conversationId, {
      content: 'reconnecting but reachable',
      channelType: 'whatsapp',
      receiver: {
        app: 'test-app',
        pin: '',
        channelType: 'whatsapp',
        clientType: undefined,
      },
    });

    expect(getMessages(queryClient, conversationId)[0]?.status).toBe(
      MessageStatusEnum.Sent,
    );
  });

  it('成功返回时应更新 messageId 且不保留 error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-template-success';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    let resolveSend:
      | ((value: {
          tempId: string;
          messageId?: string;
          status: MessageStatusEnum;
          error?: string;
        }) => void)
      | null = null;

    vi.mocked(mockMessageService.send).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        content: 'template ok',
        options: { templateMetadata: { templateId: 'tpl-3' } },
      });
    });

    await waitFor(() => {
      const optimisticMessages = getMessages(queryClient, conversationId);
      expect(optimisticMessages).toHaveLength(1);
      expect(optimisticMessages[0]?.status).toBe(MessageStatusEnum.Sending);
    });

    act(() => {
      resolveSend?.({
        tempId: 'server-temp-id',
        messageId: 'message-2001',
        status: MessageStatusEnum.Sent,
      });
    });

    await waitFor(() => {
      const sentMessage = getMessages(queryClient, conversationId)[0];
      expect(sentMessage?.status).toBe(MessageStatusEnum.Sent);
      expect(sentMessage?.id).toBe('message-2001');
      expect(sentMessage?.error).toBeUndefined();
    });
  });

  it('服务端返回网络失败结果时应保留失败消息并写入离线队列', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-network-failed';
    const mockOfflineMessageQueue = {
      createOfflineMessage: vi.fn(() => ({
        id: 'offline-msg-1',
        message: {},
        conversationId,
        sendParams: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        priority: 'normal' as const,
      })),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [1],
      },
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={mockMessageService}
          templateService={mockTemplateService}
          offlineMessageQueue={mockOfflineMessageQueue as never}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );

    vi.mocked(mockMessageService.send).mockResolvedValue({
      tempId: 'server-temp-id',
      status: MessageStatusEnum.Failed,
      error: 'socket closed',
      errorType: MessageFailureTypeEnum.Network,
    });

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId,
        content: 'retry me',
      });
    });

    const message = getMessages(queryClient, conversationId)[0];
    expect(message?.status).toBe(MessageStatusEnum.Failed);
    expect(message?._source).toBe('local');
    expect(message?._offlineMessageId).toBe('offline-msg-1');
    expect(mockOfflineMessageQueue.createOfflineMessage).toHaveBeenCalled();
    expect(mockOfflineMessageQueue.enqueue).toHaveBeenCalled();
  });

  it('useSendMessage 不应自行订阅 subscribeToMessageStatus（订阅由 useMessageStatusSync 统一管理）', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    // 订阅行为已移至 useMessageStatusSync hook，
    // useSendMessage 自身不应再持有订阅，避免多实例时重复写入缓存。
    expect(mockMessageService.subscribeToMessageStatus).not.toHaveBeenCalled();
  });

  it('应在 send 完成前预注册 ACK 映射，兼容 chatId 缺失的早到 ACK', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-early-ack';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [{ items: [] }],
        pageParams: [undefined],
      },
    );

    let resolveSend: ((value: MessageSendResult) => void) | null = null;

    vi.mocked(mockMessageService.send).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        content: 'ack first',
      });
    });

    await waitFor(() => {
      const optimisticMessage = getMessages(queryClient, conversationId)[0];
      expect(optimisticMessage).toBeDefined();
      expect(pendingMessageTracker.has(optimisticMessage?.id ?? '')).toBe(true);
      expect(pendingMessageTracker.has(optimisticMessage?.tempId ?? '')).toBe(
        true,
      );
    });

    act(() => {
      resolveSend?.({
        tempId: getMessages(queryClient, conversationId)[0]?.tempId ?? '',
        messageId: 'server-message-id',
        status: MessageStatusEnum.Sent,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(pendingMessageTracker.has('server-message-id')).toBe(true);
  });
});
