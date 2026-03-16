import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ConfigProvider } from '@/providers/config.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type {
  ConversationMetadata,
  IConversationService,
} from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore } from '@/store';
import { useChannelUnread } from './use-channel-unread.hook';

function createDeferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return {
    promise,
    resolve,
  };
}

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
      <ConfigProvider
        config={{
          activeConversationId: 'chat-wa',
          strategy: {
            allowedChannels: [ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp],
            activeChannel: ChannelTypeEnum.WhatsApp,
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

describe('useChannelUnread', () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetChatStore();
  });

  it('metadata 未返回前回退当前会话，返回后改用全部 supportedChannelSessions 的 conversationIds', async () => {
    const metadataDeferred = createDeferred<ConversationMetadata>();
    const getMetadata = mockConversationService.getMetadata;
    const getUnreadCount = mockConversationService.getUnreadCount;

    if (!getMetadata || !getUnreadCount) {
      throw new Error('conversation service methods should be implemented');
    }

    vi.mocked(getMetadata).mockImplementation(() => metadataDeferred.promise);
    vi.mocked(getUnreadCount).mockResolvedValue({
      [ChannelTypeEnum.SMS]: 2,
      [ChannelTypeEnum.WhatsApp]: 3,
    });

    renderHook(
      () => useChannelUnread([ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp]),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(getUnreadCount).toHaveBeenCalledWith({
        conversationIds: ['chat-wa'],
      });
    });

    metadataDeferred.resolve({
      supportedChannels: [ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp],
      supportedChannelSessions: [
        {
          conversationId: 'chat-sms',
          channelType: ChannelTypeEnum.SMS,
        },
        {
          conversationId: 'chat-wa',
          channelType: ChannelTypeEnum.WhatsApp,
        },
      ],
    });

    await waitFor(() => {
      expect(getUnreadCount).toHaveBeenLastCalledWith({
        conversationIds: ['chat-sms', 'chat-wa'],
      });
    });
  });
});
