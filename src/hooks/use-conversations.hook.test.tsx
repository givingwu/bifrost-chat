import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConversations } from '@/hooks/use-conversations.hook';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import { resetChatStore } from '@/store';
import { seedPendingConversationCache } from '@/test-utils/conversation-cache.test-util';

let listUpdatesCallback: ((conversations: Conversation[]) => void) | undefined;
const conversationUpdateCallbacks = new Map<
  string,
  (conversation: Conversation) => void
>();

// Mock 服务
const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
  subscribeToListUpdates: vi.fn((callback) => {
    listUpdatesCallback = callback;
    return vi.fn();
  }),
  subscribeToConversationUpdates: vi.fn((conversationId, callback) => {
    conversationUpdateCallbacks.set(conversationId, callback);
    return vi.fn(() => {
      conversationUpdateCallbacks.delete(conversationId);
    });
  }),
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: '张三',
      avatarUrl: 'https://example.com/avatar1.jpg',
      status: AgentStatusEnum.Online,
    },
    lastMessage: '你好',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
    channel: ChannelTypeEnum.WhatsApp,
    isActive: true,
  },
];

const mockMessageService = null as unknown as IMessageService;
const mockTemplateService = null as unknown as ITemplateService;

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
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

describe('useConversations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUpdatesCallback = undefined;
    conversationUpdateCallbacks.clear();
    resetChatStore();
  });

  it('应该成功获取会话列表', async () => {
    vi.mocked(mockConversationService.list).mockResolvedValue(
      mockConversations,
    );

    const { result } = renderHook(() => useConversations(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockConversations);
  });

  it('应该处理错误情况', async () => {
    const error = new Error('Network error');
    vi.mocked(mockConversationService.list).mockRejectedValue(error);

    const { result } = renderHook(() => useConversations(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('宿主推送会话列表更新时应替换当前列表', async () => {
    vi.mocked(mockConversationService.list).mockResolvedValue(
      mockConversations,
    );

    const { result } = renderHook(() => useConversations(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(listUpdatesCallback).toBeTypeOf('function');
    });

    act(() => {
      listUpdatesCallback?.([
        {
          ...mockConversations[0],
          id: 'conv-2',
          unreadCount: 0,
          lastMessage: '列表回灌',
        },
      ]);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([
        expect.objectContaining({
          id: 'conv-2',
          unreadCount: 0,
          lastMessage: '列表回灌',
        }),
      ]);
    });
  });

  it('宿主推送单会话更新时应替换对应会话', async () => {
    vi.mocked(mockConversationService.list).mockResolvedValue(
      mockConversations,
    );

    const { result } = renderHook(() => useConversations(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(conversationUpdateCallbacks.get('conv-1')).toBeTypeOf('function');
    });

    act(() => {
      conversationUpdateCallbacks.get('conv-1')?.({
        ...mockConversations[0],
        unreadCount: 7,
        lastMessage: '单会话回灌',
      });
    });

    await waitFor(() => {
      expect(result.current.data?.[0]).toMatchObject({
        id: 'conv-1',
        unreadCount: 7,
        lastMessage: '单会话回灌',
      });
    });
  });

  it('应将当前渠道的 pending 会话合并到展示列表顶部', async () => {
    vi.mocked(mockConversationService.list).mockResolvedValue(
      mockConversations,
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    seedPendingConversationCache(queryClient, ChannelTypeEnum.SMS, [
      {
        id: 'conv-pending',
        user: {
          id: 'pending-user',
          name: '待确认会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_010_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.SMS,
        metadata: {
          localState: 'pending_create',
          pendingSince: new Date(1_770_000_010_000).toISOString(),
          pendingSource: 'create',
        },
      },
    ]);

    const customWrapper = function TestWrapper({
      children,
    }: {
      children: React.ReactNode;
    }) {
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

    const { result } = renderHook(() => useConversations(), {
      wrapper: customWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map((conversation) => conversation.id)).toEqual(
      ['conv-pending', 'conv-1'],
    );
  });

  it('当服务端返回同 id 会话时应自动移除 pending', async () => {
    vi.mocked(mockConversationService.list).mockResolvedValue([
      {
        id: 'conv-merged',
        user: {
          id: 'user-merged',
          name: '正式会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '正式消息',
        lastMessageTime: new Date(1_770_000_020_000).toISOString(),
        unreadCount: 1,
        channel: ChannelTypeEnum.SMS,
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    seedPendingConversationCache(queryClient, ChannelTypeEnum.SMS, [
      {
        id: 'conv-merged',
        user: {
          id: 'pending-user',
          name: '待确认会话',
          status: AgentStatusEnum.Online,
        },
        lastMessage: '',
        lastMessageTime: new Date(1_770_000_010_000).toISOString(),
        unreadCount: 0,
        channel: ChannelTypeEnum.SMS,
        metadata: {
          localState: 'pending_create',
          pendingSince: new Date(1_770_000_010_000).toISOString(),
          pendingSource: 'create',
        },
      },
    ]);

    const customWrapper = function TestWrapper({
      children,
    }: {
      children: React.ReactNode;
    }) {
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

    const { result } = renderHook(() => useConversations(), {
      wrapper: customWrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      expect.objectContaining({
        id: 'conv-merged',
        lastMessage: '正式消息',
      }),
    ]);
    expect(
      queryClient.getQueryData(
        queryKeys.conversations.pending(ChannelTypeEnum.SMS),
      ),
    ).toEqual([]);
  });
});
