import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';
import { useMarkAsRead } from './use-mark-as-read.hook';

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

function createMessage(
  id: string,
  status: MessageStatusEnum = MessageStatusEnum.Sent,
): StandardMessage {
  return {
    id,
    conversationId: 'conv-mark-read',
    direction: MessageDirectionEnum.Incoming,
    channelType: ChannelTypeEnum.WhatsApp,
    status,
    timestamp: Date.now(),
    type: MessageTypeEnum.Text,
    content: { text: `message-${id}` },
    // 添加 sender 信息（消息发送者，即对方）
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

function getMessageStatus(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
) {
  const data = queryClient.getQueryData(
    queryKeys.messages.list(conversationId),
  ) as {
    pages: Array<{ items: StandardMessage[] }>;
  };

  const message = data.pages[0]?.items.find((item) => item.id === messageId);
  return message?.status;
}

describe('useMarkAsRead Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在请求前乐观更新消息状态为已读', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-1';

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [
        {
          items: [
            createMessage('msg-1', MessageStatusEnum.Sent),
            createMessage('msg-2', MessageStatusEnum.Delivered),
          ],
        },
      ],
      pageParams: [1],
    });

    let resolveMarkAsRead: (() => void) | null = null;
    vi.mocked(mockMessageService.markAsRead).mockImplementation(
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

    expect(getMessageStatus(queryClient, conversationId, 'msg-1')).toBe(
      MessageStatusEnum.Read,
    );
    expect(getMessageStatus(queryClient, conversationId, 'msg-2')).toBe(
      MessageStatusEnum.Delivered,
    );

    act(() => {
      resolveMarkAsRead?.();
    });

    await waitFor(() => {
      // 验证调用了 markAsRead，参数格式为 AckPacketBody
      expect(mockMessageService.markAsRead).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: 'customer-msg-1',
          app: 'fox_collect.customer',
          mid: 'msg-1',
          chatId: conversationId,
          timestamp: expect.any(Number),
        }),
      );
    });
  });

  it('请求失败时应该回滚到之前状态', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const conversationId = 'conv-2';

    queryClient.setQueryData(queryKeys.messages.list(conversationId), {
      pages: [
        {
          items: [createMessage('msg-rollback', MessageStatusEnum.Delivered)],
        },
      ],
      pageParams: [1],
    });

    vi.mocked(mockMessageService.markAsRead).mockRejectedValue(
      new Error('mark-as-read failed'),
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

    expect(getMessageStatus(queryClient, conversationId, 'msg-rollback')).toBe(
      MessageStatusEnum.Read,
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(getMessageStatus(queryClient, conversationId, 'msg-rollback')).toBe(
      MessageStatusEnum.Delivered,
    );
  });
});
