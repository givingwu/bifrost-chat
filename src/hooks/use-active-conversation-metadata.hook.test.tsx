import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore, useChatStore } from '@/store';
import { useActiveConversationMetadata } from './use-active-conversation-metadata.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
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
    resetChatStore();
  });

  it('应从会话详情派生 metadata 且不再覆盖全局 allowedChannels', async () => {
    vi.mocked(mockConversationService.get).mockResolvedValue({
      id: 'conv-1',
      user: {
        id: 'user-1',
        name: '张三',
        status: AgentStatusEnum.Online,
      },
      lastMessage: 'hello',
      lastMessageTime: new Date('2026-03-17T08:00:00.000Z').toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      isActive: true,
      supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
      metadata: {
        customerPin: '13800000000',
        supportedChannelSessions: [
          {
            channelType: ChannelTypeEnum.Email,
            conversationId: 'conv-email-1',
          },
        ],
      },
    });

    const { result } = renderHook(() => useActiveConversationMetadata(), {
      wrapper: createWrapper(),
    });

    act(() => {
      useChatStore.getState().actions.setActiveConversationId('conv-1');
    });

    await waitFor(() => {
      expect(result.current.metadata).toEqual({
        customerPin: '13800000000',
        supportedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
        supportedChannelSessions: [
          {
            channelType: ChannelTypeEnum.Email,
            conversationId: 'conv-email-1',
          },
        ],
      });
    });

    expect(useChatStore.getState().strategy.allowedChannels).toEqual([
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.SMS,
    ]);
    expect(useChatStore.getState().strategy.activeChannel).toBe(
      ChannelTypeEnum.SMS,
    );
    expect(mockConversationService.get).toHaveBeenCalledWith('conv-1');
  });

  it('无激活会话时不请求详情且返回空 metadata', async () => {
    const { result } = renderHook(() => useActiveConversationMetadata(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.metadata).toBeNull();
    });

    expect(mockConversationService.get).not.toHaveBeenCalled();
    expect(useChatStore.getState().strategy.allowedChannels).toEqual([
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.SMS,
    ]);
    expect(useChatStore.getState().strategy.activeChannel).toBe(
      ChannelTypeEnum.SMS,
    );
  });
});
