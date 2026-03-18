import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import type { AckPacketBody } from '@/interfaces/protocol.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { messageQueue } from '@/services/messaging/message-queue.service';
import { useMarkAsRead } from './use-mark-as-read.hook';

const { currentUserRef } = vi.hoisted(() => ({
  currentUserRef: {
    current: {
      app: 'fox_collect.waiter',
      pin: 'agent-001',
      status: 'online',
    },
  },
}));

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();

  return {
    ...actual,
    useStrategy: () => ({
      ...actual.useStrategy(),
      currentUser: currentUserRef.current,
    }),
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

function createMessage(
  id: string,
  status: MessageStatusEnum = MessageStatusEnum.Sent,
): StandardMessage {
  return {
    id,
    tempId: `temp-${id}`,
    conversationId: 'conv-mark-read',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status,
    timestamp: Date.now(),
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    sender: {
      app: 'fox_collect.customer',
      pin: `customer-${id}`,
    },
    receiver: {
      app: 'fox_collect.waiter',
      pin: 'agent-001',
    },
  };
}

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

function seedConversationMessages(
  queryClient: QueryClient,
  conversationId: string,
  messages: StandardMessage[],
) {
  const data = {
    pages: [{ items: messages }],
    pageParams: [1],
  };

  queryClient.setQueryData(queryKeys.messages.list(conversationId), data);
  queryClient.setQueryData(
    queryKeys.messages.list(conversationId, ChannelTypeEnum.WhatsApp),
    data,
  );
}

function getMessageStatus(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  channel?: string,
) {
  const data = queryClient.getQueryData(
    queryKeys.messages.list(conversationId, channel),
  ) as {
    pages: Array<{ items: StandardMessage[] }>;
  };

  const message = data.pages[0]?.items.find((item) => item.id === messageId);
  return message?.status;
}

describe('useMarkAsRead Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageQueue.clear();
    mockMessageService.markAsRead = vi.fn();
    currentUserRef.current = {
      app: 'fox_collect.waiter',
      pin: 'agent-001',
      status: AgentStatusEnum.Online,
    };
  });

  it('旧宿主应继续乐观更新，并透传 meta.requestId', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-1';

    seedConversationMessages(queryClient, conversationId, [
      createMessage('msg-1', MessageStatusEnum.Delivered),
      createMessage('msg-2', MessageStatusEnum.Delivered),
    ]);

    let resolveMarkAsRead: (() => void) | null = null;
    mockMessageService.markAsRead = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveMarkAsRead = resolve;
        }),
    );

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        messageIds: ['msg-1'],
      });
    });

    await waitFor(() => {
      expect(getMessageStatus(queryClient, conversationId, 'msg-1')).toBe(
        MessageStatusEnum.Read,
      );
      expect(
        getMessageStatus(
          queryClient,
          conversationId,
          'msg-1',
          ChannelTypeEnum.WhatsApp,
        ),
      ).toBe(MessageStatusEnum.Read);
    });

    act(() => {
      resolveMarkAsRead?.();
    });

    await waitFor(() => {
      expect(mockMessageService.markAsRead).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: 'agent-001',
          app: 'fox_collect.waiter',
          mid: 'msg-1',
          chatId: conversationId,
          timestamp: expect.any(Number),
        }),
        expect.objectContaining({
          requestId: expect.any(String),
          conversationId,
          messageId: 'msg-1',
          channelType: ChannelTypeEnum.WhatsApp,
        }),
      );
    });
  });

  it('旧宿主失败时应回滚所有会话消息缓存分片', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-2';

    seedConversationMessages(queryClient, conversationId, [
      createMessage('msg-rollback', MessageStatusEnum.Delivered),
    ]);

    let rejectMarkAsRead: ((error: Error) => void) | null = null;
    mockMessageService.markAsRead = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectMarkAsRead = reject;
        }),
    );

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createTestWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        conversationId,
        messageIds: ['msg-rollback'],
      });
    });

    await waitFor(() => {
      expect(
        getMessageStatus(queryClient, conversationId, 'msg-rollback'),
      ).toBe(MessageStatusEnum.Read);
    });

    act(() => {
      rejectMarkAsRead?.(new Error('mark-as-read failed'));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(getMessageStatus(queryClient, conversationId, 'msg-rollback')).toBe(
      MessageStatusEnum.Delivered,
    );
    expect(
      getMessageStatus(
        queryClient,
        conversationId,
        'msg-rollback',
        ChannelTypeEnum.WhatsApp,
      ),
    ).toBe(MessageStatusEnum.Delivered);
  });

  it('严格 ACK 模式下不应立即标记为已读，而应登记队列项', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-3';

    seedConversationMessages(queryClient, conversationId, [
      createMessage('msg-strict', MessageStatusEnum.Delivered),
    ]);

    const strictCalls: Array<[unknown, unknown]> = [];
    mockMessageService.markAsRead = function markAsReadStrict(
      params: AckPacketBody,
      meta?: { requestId?: string },
    ) {
      strictCalls.push([params, meta]);
      return Promise.resolve({
        ackRequestId: meta?.requestId,
      });
    };

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId,
        messageIds: ['msg-strict'],
      });
    });

    expect(getMessageStatus(queryClient, conversationId, 'msg-strict')).toBe(
      MessageStatusEnum.Delivered,
    );
    expect(strictCalls).toHaveLength(1);

    const meta = strictCalls[0]?.[1] as { requestId?: string } | undefined;
    expect(meta?.requestId).toBeTruthy();
    expect(messageQueue.findById(meta?.requestId ?? '')).toBeDefined();
  });

  it('坐席自己发送的消息不应发送 msg_read_ack', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-self';
    const selfSentMessage: StandardMessage = {
      ...createMessage('msg-self', MessageStatusEnum.Delivered),
      sender: {
        app: 'fox_collect.waiter',
        pin: 'agent-001',
      },
      receiver: {
        app: 'fox_collect.customer',
        pin: 'customer-001',
      },
    };

    seedConversationMessages(queryClient, conversationId, [selfSentMessage]);

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId,
        messageIds: ['msg-self'],
      });
    });

    expect(mockMessageService.markAsRead).not.toHaveBeenCalled();
    expect(getMessageStatus(queryClient, conversationId, 'msg-self')).toBe(
      MessageStatusEnum.Delivered,
    );
    expect(
      getMessageStatus(
        queryClient,
        conversationId,
        'msg-self',
        ChannelTypeEnum.WhatsApp,
      ),
    ).toBe(MessageStatusEnum.Delivered);
  });
});
