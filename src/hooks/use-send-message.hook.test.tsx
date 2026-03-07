import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function getMessages(queryClient: QueryClient, conversationId: string) {
  const data = queryClient.getQueryData(
    queryKeys.messages.list(conversationId),
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
  });

  it('应在发送成功后回填服务端 messageId 并更新状态', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-mobile';

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [{ items: [] }],
      pageParams: [1],
    });

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
        extra: { clientType: 'mobile' },
      });
    });

    await waitFor(() => {
      const optimisticMessages = getMessages(queryClient, conversationId);
      expect(optimisticMessages).toHaveLength(1);
      expect(optimisticMessages[0]?.status).toBe(MessageStatusEnum.Sending);
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
    expect(mockMessageService.send).toHaveBeenCalledWith(conversationId, {
      content: 'hello from mobile',
      clientType: 'mobile',
      receiver: {
        channelType: 'waba',
        clientType: undefined,
        pin: undefined,
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

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [{ items: [] }],
      pageParams: [1],
    });

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
        extra: { templateId: 'tpl-1' },
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

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [{ items: [] }],
      pageParams: [1],
    });

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
        extra: { templateId: 'tpl-2' },
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

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [{ items: [] }],
      pageParams: [1],
    });

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
        extra: { templateId: 'tpl-3' },
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
});
