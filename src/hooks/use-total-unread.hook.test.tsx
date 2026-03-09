import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';
import { useTotalUnread } from './use-total-unread.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
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

const mockTemplateService: ITemplateService = {
  list: vi.fn(),
  preview: vi.fn(),
};

function createConversation(id: string, unreadCount: number): Conversation {
  return {
    id,
    user: {
      id: `user-${id}`,
      name: `用户-${id}`,
      status: AgentStatusEnum.Offline,
    },
    lastMessage: `message-${id}`,
    lastMessageTime: new Date(1_770_000_000_000).toISOString(),
    unreadCount,
    channel: ChannelTypeEnum.WhatsApp,
  };
}

function createWrapper(queryClient: QueryClient) {
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

describe('useTotalUnread', () => {
  it('应直接基于会话缓存中的 unreadCount 计算总未读', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(mockConversationService.list).mockResolvedValue([
      createConversation('conv-1', 2),
      createConversation('conv-2', 1),
    ]);

    const { result } = renderHook(() => useTotalUnread(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(3);
    });

    act(() => {
      queryClient.setQueryData(queryKeys.conversations.list(), [
        createConversation('conv-1', 4),
        createConversation('conv-2', 3),
      ]);
    });

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(7);
    });
  });
});
