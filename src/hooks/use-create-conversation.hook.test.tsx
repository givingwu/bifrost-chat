import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { useCreateConversation } from './use-create-conversation.hook';

vi.mock('@/store', async () => {
  const actual = await vi.importActual<typeof import('@/store')>('@/store');

  return {
    ...actual,
    useStrategy: () => ({
      activeChannel: ChannelTypeEnum.WhatsApp,
    }),
    useActions: () => ({
      replaceNetwork: vi.fn(),
    }),
  };
});

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockMessageService = null as unknown as IMessageService;
const mockTemplateService = null as unknown as ITemplateService;

type CreateConversationResult = Conversation & {
  metadata: Record<string, unknown>;
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

describe('useCreateConversation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('创建请求进行中应写入 creating cache，成功后立即移除并替换为真实会话', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    let resolveCreate: ((value: CreateConversationResult) => void) | undefined;
    const createPromise = new Promise<CreateConversationResult>((resolve) => {
      resolveCreate = resolve;
    });

    vi.mocked(mockConversationService.create).mockReturnValue(
      createPromise as ReturnType<typeof mockConversationService.create>,
    );

    const { result } = renderHook(
      () =>
        useCreateConversation<{
          debtorId: string;
          contactId: string;
          channelType: ChannelTypeEnum;
        }>(true),
      {
        wrapper: createTestWrapper(queryClient),
      },
    );

    let mutationPromise: Promise<unknown> | undefined;
    await act(async () => {
      mutationPromise = result.current.mutateAsync({
        debtorId: 'debtor-1',
        contactId: 'contact-1',
        channelType: ChannelTypeEnum.WhatsApp,
      });
      await Promise.resolve();
    });

    expect(
      queryClient.getQueryData(
        queryKeys.conversations.creating(ChannelTypeEnum.WhatsApp),
      ),
    ).toEqual([
      expect.objectContaining({
        metadata: expect.objectContaining({
          localState: 'creating',
          pendingSource: 'create',
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        }),
      }),
    ]);

    resolveCreate?.({
      id: 'conv-created',
      user: {
        id: 'user-created',
        name: '新会话',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date(1_770_000_000_000).toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      metadata: {
        debtorId: 'debtor-1',
        contactId: 'contact-1',
      },
    });

    await act(async () => {
      await mutationPromise;
    });

    expect(
      queryClient.getQueryData(
        queryKeys.conversations.creating(ChannelTypeEnum.WhatsApp),
      ),
    ).toEqual([]);
    expect(
      queryClient.getQueryData(
        queryKeys.conversations.pending(ChannelTypeEnum.WhatsApp),
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'conv-created',
      }),
    ]);
  });

  it('创建成功后应写入当前渠道 pending cache，且不触发 conversations list invalidate', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.mocked(mockConversationService.create).mockResolvedValue({
      id: 'conv-created',
      user: {
        id: 'user-created',
        name: '新会话',
        status: AgentStatusEnum.Online,
      },
      lastMessage: '',
      lastMessageTime: new Date(1_770_000_000_000).toISOString(),
      unreadCount: 0,
      channel: ChannelTypeEnum.WhatsApp,
      metadata: {
        debtorId: 'debtor-1',
        contactId: 'contact-1',
      },
    });

    const { result } = renderHook(
      () =>
        useCreateConversation<{
          debtorId: string;
          contactId: string;
          channelType: ChannelTypeEnum;
        }>(true),
      {
        wrapper: createTestWrapper(queryClient),
      },
    );

    await act(async () => {
      await result.current.mutateAsync({
        debtorId: 'debtor-1',
        contactId: 'contact-1',
        channelType: ChannelTypeEnum.WhatsApp,
      });
    });

    expect(
      queryClient.getQueryData(
        queryKeys.conversations.pending(ChannelTypeEnum.WhatsApp),
      ),
    ).toEqual([
      expect.objectContaining({
        id: 'conv-created',
        metadata: expect.objectContaining({
          localState: 'pending_create',
          pendingSource: 'create',
          debtorId: 'debtor-1',
          contactId: 'contact-1',
        }),
      }),
    ]);
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});
