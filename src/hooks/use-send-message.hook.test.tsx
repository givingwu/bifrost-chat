import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import {
  type MessageSendResult,
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import { messageQueue } from '@/services/message-queue.service';
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import type { ITemplateService } from '@/services/template.service';
import type { CurrentUser } from '@/store';
import { useSendMessage } from './use-send-message.hook';

// Mock useStrategy
const mockCurrentUser: CurrentUser = {
  app: 'test-app',
  pin: 'test-agent-123',
  status: AgentStatusEnum.Online,
};

vi.mock('@/store', () => ({
  useStrategy: () => ({
    activeChannel: 'waba' as const,
    allowedChannels: ['waba' as const],
    currentUser: mockCurrentUser,
  }),
  useActiveConversationId: () => 'conv-1',
}));

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

// useStrategy mock 的 activeChannel 为 waba，需与 query key 一致
const ACTIVE_CHANNEL = 'waba';

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

describe('useSendMessage Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingMessageTracker.clear();
    messageQueue.clear();
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
      channelType: 'waba',
      receiver: {
        app: 'test-app',
        pin: '',
        channelType: 'waba',
        clientType: undefined,
      },
    });
  });

  it('应在服务返回失败状态时标记为失败、保留消息并显示 retry 按钮', async () => {
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
      const failedMessage = getMessages(queryClient, conversationId)[0];
      expect(failedMessage?.status).toBe(MessageStatusEnum.Failed);
      expect(failedMessage?.error).toBe('template limit reached');
      // 验证消息保留在列表中（而不是被删除）
      expect(getMessages(queryClient, conversationId)).toHaveLength(1);
    });
  });

  it('应在服务返回 error 但状态非 Failed 时依旧标记失败、保留消息并显示 retry 按钮', async () => {
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
      const failedMessage = getMessages(queryClient, conversationId)[0];
      expect(failedMessage?.status).toBe(MessageStatusEnum.Failed);
      expect(failedMessage?.error).toBe('template limit reached');
      // 验证消息保留在列表中（而不是被删除）
      expect(getMessages(queryClient, conversationId)).toHaveLength(1);
    });
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

  it('应在挂载时订阅 subscribeToMessageStatus，收到 ack 回调后将消息状态更新为 sent', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-ack';
    const tempId = 'temp-ack-1';
    const messageId = 'msg-ack-1001';

    queryClient.setQueryData(
      queryKeys.messages.list(conversationId, ACTIVE_CHANNEL),
      {
        pages: [
          {
            items: [
              {
                id: messageId,
                tempId,
                content: { text: 'pending ack' },
                direction: 'outgoing' as const,
                channelType: 'waba',
                status: MessageStatusEnum.Sending,
                timestamp: Date.now(),
                type: 'text' as const,
                conversationId,
              },
            ],
          },
        ],
        pageParams: [undefined],
      },
    );

    let statusCallback: (event: {
      conversationId: string;
      messageId: string;
      tempId?: string;
      channelType?: string;
      status: MessageStatusEnum;
      timestamp: number;
    }) => void = () => {};
    vi.mocked(mockMessageService.subscribeToMessageStatus).mockImplementation(
      (cb) => {
        statusCallback = cb as typeof statusCallback;
        return () => {};
      },
    );

    renderHook(() => useSendMessage(), {
      wrapper: createTestWrapper(queryClient),
    });

    expect(mockMessageService.subscribeToMessageStatus).toHaveBeenCalledTimes(
      1,
    );

    act(() => {
      statusCallback({
        conversationId,
        messageId,
        tempId,
        channelType: 'waba',
        status: MessageStatusEnum.Sent,
        timestamp: Date.now(),
      });
    });

    const messages = getMessages(queryClient, conversationId);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.status).toBe(MessageStatusEnum.Sent);
    expect(messages[0]?.id).toBe(messageId);
    expect(messages[0]?.tempId).toBe(tempId);
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
