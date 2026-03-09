import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConversations } from '@/hooks/use-conversations.hook';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';

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

  it('宿主推送列表更新时应覆盖 Query 缓存', async () => {
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

    const nextConversations: Conversation[] = [
      {
        ...mockConversations[0],
        unreadCount: 5,
        lastMessage: '最新列表回灌',
      },
    ];

    act(() => {
      listUpdatesCallback?.(nextConversations);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(nextConversations);
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
});
