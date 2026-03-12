import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore, useChatStore } from '@/store';
import { useTotalUnread } from './use-total-unread.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
  getUnreadCount: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    resetChatStore();
    useChatStore.getState().actions.setStrategy({
      allowedChannels: [ChannelTypeEnum.WhatsApp],
    });
  });

  it('应通过 getUnreadCount API 获取总未读数', async () => {
    vi.mocked(mockConversationService.getUnreadCount!).mockResolvedValue({
      [ChannelTypeEnum.WhatsApp]: 5,
      [ChannelTypeEnum.SMS]: 3, // SMS 不在 allowedChannels 中，不计入
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useTotalUnread(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      // 仅统计 allowedChannels 中的渠道（WhatsApp=5，SMS 排除）
      expect(result.current.totalUnread).toBe(5);
    });

    expect(mockConversationService.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('getUnreadCount 返回空时应为 0', async () => {
    vi.mocked(mockConversationService.getUnreadCount!).mockResolvedValue({});

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(() => useTotalUnread(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(0);
    });
  });
});
