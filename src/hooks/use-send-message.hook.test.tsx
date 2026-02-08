import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';
import { useSendMessage } from './use-send-message.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockTemplateService: ITemplateService = {
  list: vi.fn(),
  send: vi.fn(),
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
    });
  });
});
