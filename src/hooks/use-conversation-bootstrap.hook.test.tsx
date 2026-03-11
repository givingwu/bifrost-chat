import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConfigProvider } from '@/providers/config.provider';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { useChatStore } from '@/store';
import { useConversationBootstrap } from './use-conversation-bootstrap.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockMessageService = null as unknown as IMessageService;
const mockTemplateService = null as unknown as ITemplateService;

function createConversation(
  id: string,
  channel: ChannelTypeEnum,
): Conversation {
  return {
    id,
    user: {
      id: `user-${id}`,
      name: `User ${id}`,
      status: AgentStatusEnum.Online,
    },
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0,
    channel,
    supportedChannels: [channel],
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <ConfigProvider
        config={{
          strategy: {
            allowedChannels: [ChannelTypeEnum.SMS],
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

  return { wrapper, queryClient };
}

describe('useConversationBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('query 命中时应直接激活已有会话', async () => {
    const existingConversation = createConversation(
      'conv-existing',
      ChannelTypeEnum.WhatsApp,
    );
    vi.mocked(mockConversationService.query).mockResolvedValue(
      existingConversation,
    );

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () =>
        useConversationBootstrap({
          queryParams: { chatId: 'chat-1' },
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(useChatStore.getState().conversation.activeConversationId).toBe(
        'conv-existing',
      );
    });

    expect(mockConversationService.create).not.toHaveBeenCalled();
    expect(useChatStore.getState().strategy.activeChannel).toBe(
      ChannelTypeEnum.WhatsApp,
    );
    expect(
      queryClient.getQueryData(queryKeys.conversations.list('whatsapp')),
    ).toBeTruthy();
  });

  it('query 未命中时应回退创建会话', async () => {
    const createdConversation = createConversation(
      'conv-created',
      ChannelTypeEnum.Email,
    );
    vi.mocked(mockConversationService.query).mockResolvedValue(null);
    vi.mocked(mockConversationService.create).mockResolvedValue(
      createdConversation,
    );

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () =>
        useConversationBootstrap({
          queryParams: { debtorId: 1 },
          createParams: { debtorId: 1, contactId: 2 },
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(useChatStore.getState().conversation.activeConversationId).toBe(
        'conv-created',
      );
    });

    expect(mockConversationService.query).toHaveBeenCalledTimes(1);
    expect(mockConversationService.create).toHaveBeenCalledWith({
      debtorId: 1,
      contactId: 2,
    });
    expect(useChatStore.getState().strategy.activeChannel).toBe(
      ChannelTypeEnum.Email,
    );
    expect(
      queryClient.getQueryData(queryKeys.conversations.list('email')),
    ).toBeTruthy();
  });
});
