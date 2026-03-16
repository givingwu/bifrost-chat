import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore } from '@/store';
import { useChannelUnread } from './use-channel-unread.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
  getMetadata: vi.fn(),
  getUnreadCount: vi.fn(),
};

const mockMessageService = null as unknown as IMessageService;
const mockTemplateService = null as unknown as ITemplateService;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

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

describe('useChannelUnread', () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetChatStore();
  });

  it('应基于 getUnreadCount 返回值计算各渠道未读数量', async () => {
    const getUnreadCount = mockConversationService.getUnreadCount;

    if (!getUnreadCount) {
      throw new Error(
        'conversation service getUnreadCount should be implemented',
      );
    }

    vi.mocked(getUnreadCount).mockResolvedValue({
      [ChannelTypeEnum.SMS]: 2,
      [ChannelTypeEnum.WhatsApp]: 3,
    });

    const { result } = renderHook(
      () => useChannelUnread([ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp]),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current[ChannelTypeEnum.SMS]).toBe(2);
      expect(result.current[ChannelTypeEnum.WhatsApp]).toBe(3);
    });

    expect(getUnreadCount).toHaveBeenCalledTimes(1);
    expect(getUnreadCount).toHaveBeenCalledWith();
  });
});
