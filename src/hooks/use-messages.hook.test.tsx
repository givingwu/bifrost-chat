import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceProvider } from '@/providers/service.provider';
import { queryKeys } from '@/providers/query.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { ITemplateService } from '@/services/core/template.service';
import type { InfiniteQueryData } from '@/services/cache/message-cache-helper.service';
import { resetChatStore } from '@/store';
import { useMessages } from './use-messages.hook';

const listMock = vi.fn();
const getConversationDetailMock = vi.fn();

const mockConversationService = {
  list: vi.fn(),
  get: getConversationDetailMock,
  create: vi.fn(),
  query: vi.fn(),
} as IConversationService;
const mockTemplateService = {} as ITemplateService;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const messageService = {
    list: listMock,
  } as unknown as IMessageService;

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={messageService}
          templateService={mockTemplateService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useMessages', () => {
  afterEach(() => {
    listMock.mockReset();
    resetChatStore();
  });

  it('成功获取第一页消息', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        direction: 'incoming' as const,
        channelType: 'whatsapp' as const,
        status: 'sent' as const,
        timestamp: Date.now(),
        type: 'text' as const,
        content: { text: '第一条消息' },
        sender: { id: 'user-1', name: '用户1' },
        receiver: { id: 'agent-1', name: '客服1' },
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        direction: 'outgoing' as const,
        channelType: 'whatsapp' as const,
        status: 'sent' as const,
        timestamp: Date.now() - 1000,
        type: 'text' as const,
        content: { text: '第二条消息' },
        sender: { id: 'agent-1', name: '客服1' },
        receiver: { id: 'user-1', name: '用户1' },
      },
    ];
    listMock.mockResolvedValue(mockMessages);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].items).toEqual(mockMessages);
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith('conv-1', {
      conversationId: 'conv-1',
      page: 1,
    });
  });

  it('支持无限滚动加载更多消息', async () => {
    const page1Messages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - i * 1000,
      type: 'text' as const,
      content: { text: `消息 ${i}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));

    const page2Messages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i + 20}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - (i + 20) * 1000,
      type: 'text' as const,
      content: { text: `消息 ${i + 20}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));

    listMock
      .mockResolvedValueOnce(page1Messages)
      .mockResolvedValueOnce(page2Messages);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    // 加载下一页
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(result.current.data?.pages[0].items).toEqual(page1Messages);
    expect(result.current.data?.pages[1].items).toEqual(page2Messages);
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(listMock).toHaveBeenNthCalledWith(1, 'conv-1', {
      conversationId: 'conv-1',
      page: 1,
    });
    expect(listMock).toHaveBeenNthCalledWith(2, 'conv-1', {
      conversationId: 'conv-1',
      page: 2,
    });
  });

  it('当消息少于20条时没有下一页', async () => {
    const mockMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - i * 1000,
      type: 'text' as const,
      content: { text: `消息 ${i}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));
    listMock.mockResolvedValue(mockMessages);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('处理服务错误', async () => {
    const mockError = new Error('Failed to fetch messages');
    listMock.mockRejectedValue(mockError);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('显示加载状态', async () => {
    const mockPromise = new Promise<unknown>(() => {});
    listMock.mockReturnValue(mockPromise);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    // React Query 应该开始获取数据
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });
  });

  it('返回空消息当服务未提供', async () => {
    const mockMessageService = null as unknown as IMessageService;

    function createWrapperWithoutService() {
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

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapperWithoutService(),
      },
    );

    // 当服务未提供时，查询被禁用，fetchStatus 应该是 idle
    expect(result.current.fetchStatus).toBe('idle');
    expect(listMock).not.toHaveBeenCalled();
  });

  it('使用缓存数据（5分钟内不重复请求）', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        direction: 'incoming' as const,
        channelType: 'whatsapp' as const,
        status: 'sent' as const,
        timestamp: Date.now(),
        type: 'text' as const,
        content: { text: '第一条消息' },
        sender: { id: 'user-1', name: '用户1' },
        receiver: { id: 'agent-1', name: '客服1' },
      },
    ];
    listMock.mockResolvedValue(mockMessages);

    const { result, rerender } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(listMock).toHaveBeenCalledTimes(1);

    // 重新渲染，应该使用缓存不重新请求
    rerender();

    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('当缓存来自推送写入（pageParams[0] 为 undefined）时应强制拉取历史', async () => {
    const offlineMessages = [
      {
        id: 'offline-1',
        conversationId: 'conv-1',
        direction: 'incoming' as const,
        channelType: 'whatsapp' as const,
        status: 'sent' as const,
        timestamp: Date.now(),
        type: 'text' as const,
        content: { text: '离线消息 1' },
        sender: { id: 'user-1', name: '用户1' },
        receiver: { id: 'agent-1', name: '客服1' },
      },
      {
        id: 'offline-2',
        conversationId: 'conv-1',
        direction: 'incoming' as const,
        channelType: 'whatsapp' as const,
        status: 'sent' as const,
        timestamp: Date.now() - 1000,
        type: 'text' as const,
        content: { text: '离线消息 2' },
        sender: { id: 'user-1', name: '用户1' },
        receiver: { id: 'agent-1', name: '客服1' },
      },
    ];

    const serverMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `srv-${i}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - i * 1000,
      type: 'text' as const,
      content: { text: `历史消息 ${i}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));

    listMock.mockResolvedValueOnce(serverMessages);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // 模拟“推送写入消息缓存”：
    // - pages[0] 只有 items（没有 nextCursor）
    // - pageParams[0] 为 undefined（用于区分推送写入 vs list 初始化）
    queryClient.setQueryData(
      queryKeys.messages.list('conv-1', 'whatsapp'),
      {
        pages: [{ items: offlineMessages }],
        pageParams: [undefined],
      } as unknown as InfiniteQueryData,
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={
            { list: listMock } as unknown as IMessageService
          }
          templateService={mockTemplateService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
          currentChannel: 'whatsapp',
        }),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await waitFor(() => {
      expect(listMock).toHaveBeenCalledTimes(1);
    });
    expect(listMock).toHaveBeenCalledWith('conv-1', {
      conversationId: 'conv-1',
      currentChannel: 'whatsapp',
      page: 1,
    });
  });

  it('显示正在加载下一页的状态', async () => {
    const page1Messages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - i * 1000,
      type: 'text' as const,
      content: { text: `消息 ${i}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));

    const page2Messages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i + 20}`,
      conversationId: 'conv-1',
      direction: 'incoming' as const,
      channelType: 'whatsapp' as const,
      status: 'sent' as const,
      timestamp: Date.now() - (i + 20) * 1000,
      type: 'text' as const,
      content: { text: `消息 ${i + 20}` },
      sender: { id: 'user-1', name: '用户1' },
      receiver: { id: 'agent-1', name: '客服1' },
    }));

    // 设置两次返回，一次用于初始加载，一次用于加载下一页
    listMock.mockResolvedValueOnce(page1Messages);
    listMock.mockResolvedValueOnce(page2Messages);

    const { result } = renderHook(
      () =>
        useMessages({
          conversationId: 'conv-1',
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(false);

    // 开始加载下一页
    act(() => {
      void result.current.fetchNextPage();
    });

    // 等待 fetchNextPage 完成执行，并验证第二页数据
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });
  });
});
