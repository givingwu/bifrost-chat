import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { useChatStore } from '@/store';
import { useActiveConversationMetadata } from './use-active-conversation-metadata.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
  getMetadata: vi.fn(),
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
      <ConfigProvider
        config={{
          strategy: {
            allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.SMS],
            activeChannel: ChannelTypeEnum.SMS,
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ServiceProvider
            conversationService={mockConversationService}
            messageService={mockMessageService}
            templateService={mockTemplateService}
          >
            {children}
          </ServiceProvider>
        </QueryClientProvider>
      </ConfigProvider>
    );
  };
}

describe('useActiveConversationMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应根据会话元数据缩窄允许渠道并校正激活渠道', async () => {
    const getMetadata = mockConversationService.getMetadata;
    if (!getMetadata) {
      throw new Error('getMetadata should be implemented in this test');
    }
    vi.mocked(getMetadata).mockResolvedValue({
      supportedChannels: [ChannelTypeEnum.WhatsApp],
    });

    renderHook(() => useActiveConversationMetadata(), {
      wrapper: createWrapper(),
    });

    act(() => {
      useChatStore.getState().actions.setActiveConversationId('conv-1');
    });

    await waitFor(() => {
      expect(useChatStore.getState().strategy.allowedChannels).toEqual([
        ChannelTypeEnum.WhatsApp,
      ]);
      expect(useChatStore.getState().strategy.activeChannel).toBe(
        ChannelTypeEnum.WhatsApp,
      );
    });

    expect(mockConversationService.getMetadata).toHaveBeenCalledWith({
      id: 'conv-1',
    });
  });

  it('无激活会话时应恢复配置层允许渠道', async () => {
    const getMetadata = mockConversationService.getMetadata;
    if (!getMetadata) {
      throw new Error('getMetadata should be implemented in this test');
    }
    vi.mocked(getMetadata).mockResolvedValue({
      supportedChannels: [ChannelTypeEnum.WhatsApp],
    });

    renderHook(() => useActiveConversationMetadata(), {
      wrapper: createWrapper(),
    });

    act(() => {
      useChatStore.getState().actions.setActiveConversationId('conv-1');
    });

    await waitFor(() => {
      expect(useChatStore.getState().strategy.allowedChannels).toEqual([
        ChannelTypeEnum.WhatsApp,
      ]);
    });

    act(() => {
      useChatStore.getState().actions.setActiveConversationId('');
    });

    await waitFor(() => {
      expect(useChatStore.getState().strategy.allowedChannels).toEqual([
        ChannelTypeEnum.WhatsApp,
      ]);
    });

    expect(useChatStore.getState().strategy.activeChannel).toBe(
      ChannelTypeEnum.WhatsApp,
    );
  });
});
