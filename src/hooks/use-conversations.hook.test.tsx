import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/conversation.service';

// Mock 服务
const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: {
      id: 'user-1',
      name: '张三',
      avatarUrl: 'https://example.com/avatar1.jpg',
      status: 'online' as any,
    },
    lastMessage: '你好',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
    channel: 'whatsapp' as any,
    isActive: true,
  },
];

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
          messageService={null as any}
          templateService={null as any}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useConversations Hook', () => {
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
});
