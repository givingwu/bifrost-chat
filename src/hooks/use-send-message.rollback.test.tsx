import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import {
  MessageFailureTypeEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import type { CurrentUser } from '@/store';

// Mock services
const mockOfflineMessageQueue = {
  createOfflineMessage: vi.fn(),
  enqueue: vi.fn(),
  getAll: vi.fn(),
};

const mockMessageService = {
  send: vi.fn(),
};

// Mock ServiceProvider
vi.mock('@/providers/service.provider', () => ({
  useServices: () => ({
    messageService: mockMessageService,
    offlineMessageQueue: mockOfflineMessageQueue,
  }),
}));

// Mock useStrategy
const mockCurrentUser: CurrentUser = {
  app: 'test-app',
  pin: 'test-agent-123',
  status: AgentStatusEnum.Online,
};

vi.mock('@/store', () => ({
  useStrategy: () => ({
    activeChannel: 'waba' as const,
    allowedChannels: ['waba' as const],
    currentUser: mockCurrentUser,
  }),
  useActiveConversationId: () => 'conv-1',
}));

// Mock MessageBuilder
vi.mock('@/services/message-builder.service', () => ({
  MessageBuilder: {
    buildTextMessage: vi.fn((content, options) => ({
      id: 'temp-msg-1',
      tempId: 'temp-msg-1',
      content: { text: content },
      direction: 'outgoing' as const,
      channelType: options.channelType,
      status: MessageStatusEnum.Created,
      timestamp: Date.now(),
      type: 'text' as const,
      sender: {
        app: options.fromApp ?? 'bifrost-chat-sdk',
        pin: options.fromPin,
      },
      receiver: {
        app: options.toApp ?? '',
        pin: options.toPin,
      },
    })),
    generateUniqueId: vi.fn(() => 'offline-msg-1'),
  },
}));

describe('useSendMessage - 消息回滚与离线队列功能测试', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: ReactNode }>;

  beforeEach(() => {
    // 清理所有 mock
    vi.clearAllMocks();

    // 创建新的 QueryClient
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
        queries: {
          retry: false,
        },
      },
    });

    // 创建 wrapper
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Mock offline message queue
    mockOfflineMessageQueue.createOfflineMessage.mockReturnValue({
      id: 'offline-msg-1',
      message: {},
      conversationId: 'conv-1',
      sendParams: {},
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      priority: 'normal' as const,
    });
  });

  describe('网络错误场景（onError - 离线队列）', () => {
    it('应该保存到离线队列并保留失败消息', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      // Mock 后端抛出网络错误
      mockMessageService.send.mockRejectedValue(new Error('网络连接失败'));

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            conversationId,
            content,
          }),
        ).rejects.toThrow('网络连接失败');
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证保存到离线队列
      expect(mockOfflineMessageQueue.createOfflineMessage).toHaveBeenCalled();
      expect(mockOfflineMessageQueue.enqueue).toHaveBeenCalled();

      // 验证消息保留在缓存中，状态为 Failed（useStrategy mock 的 activeChannel 为 waba）
      const messageQueryKey = queryKeys.messages.list(conversationId, 'waba');
      const data = queryClient.getQueryData<{
        pages: Array<{
          items: Array<{
            status: string;
            _source?: string;
            _offlineMessageId?: string;
            error?: string;
          }>;
        }>;
      }>(messageQueryKey);

      expect(data).toBeDefined();
      expect(data?.pages[0].items).toHaveLength(1);
      expect(data?.pages[0].items[0].status).toBe(MessageStatusEnum.Failed);
      expect(data?.pages[0].items[0]._source).toBe('local');
      expect(data?.pages[0].items[0].error).toBe('网络连接失败');
    });
  });

  describe('业务逻辑错误场景（onSuccess + isFailed - 完全回滚）', () => {
    it('应该完全回滚到发送前状态，移除临时消息', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const errorMessage = '已达到发送次数上限';

      // 初始化缓存（模拟发送前有 1 条消息，需与 useStrategy mock 的 activeChannel 一致）
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId, 'waba'),
        {
          pages: [
            {
              items: [
                {
                  id: 'existing-msg-1',
                  content: { text: '已存在的消息' },
                  status: MessageStatusEnum.Sent,
                  timestamp: Date.now() - 1000,
                },
              ],
            },
          ],
        },
      );

      // Mock 后端返回业务逻辑错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        errorType: MessageFailureTypeEnum.Quota,
        retryable: false,
      });

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversationId,
          content,
        });
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证：不应该调用离线队列（因为业务错误完全回滚）
      expect(
        mockOfflineMessageQueue.createOfflineMessage,
      ).not.toHaveBeenCalled();
      expect(mockOfflineMessageQueue.enqueue).not.toHaveBeenCalled();

      // 验证：缓存应该回滚到发送前状态（只有 1 条已存在的消息）
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ id: string }> }>;
      }>(queryKeys.messages.list(conversationId, 'waba'));

      expect(data).toBeDefined();
      expect(data?.pages).toHaveLength(1);
      expect(data?.pages[0].items).toHaveLength(1);
      expect(data?.pages[0].items[0].id).toBe('existing-msg-1');
    });

    it('应该在空列表时也正确回滚', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const errorMessage = '验证失败';

      // 初始化空缓存（需与 useStrategy mock 的 activeChannel 一致）
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId, 'waba'),
        {
          pages: [{ items: [] }],
        },
      );

      // Mock 后端返回业务逻辑错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        errorType: MessageFailureTypeEnum.Validation,
        retryable: false,
      });

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversationId,
          content,
        });
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证：缓存应该回滚到空列表
      const data = queryClient.getQueryData<{
        pages: Array<{ items: unknown[] }>;
      }>(queryKeys.messages.list(conversationId, 'waba'));

      expect(data?.pages[0].items).toHaveLength(0);
    });

    it('即使标记为可重试也应该完全回滚', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const errorMessage = '服务器错误';

      // 初始化缓存（需与 useStrategy mock 的 activeChannel 一致）
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId, 'waba'),
        {
          pages: [
            {
              items: [
                {
                  id: 'existing-msg-1',
                  content: { text: '已存在的消息' },
                  status: MessageStatusEnum.Sent,
                  timestamp: Date.now() - 1000,
                },
              ],
            },
          ],
        },
      );

      // Mock 后端返回业务逻辑错误（即使标记为可重试）
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        errorType: MessageFailureTypeEnum.Quota,
        retryable: true,
      });

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversationId,
          content,
        });
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证：不应该调用离线队列
      expect(
        mockOfflineMessageQueue.createOfflineMessage,
      ).not.toHaveBeenCalled();
      expect(mockOfflineMessageQueue.enqueue).not.toHaveBeenCalled();

      // 验证：缓存应该回滚到发送前状态
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ id: string }> }>;
      }>(queryKeys.messages.list(conversationId, 'waba'));

      expect(data?.pages[0].items).toHaveLength(1);
      expect(data?.pages[0].items[0].id).toBe('existing-msg-1');
    });
  });

  describe('向后兼容性测试', () => {
    it('当没有设置 errorType 和 retryable 时，默认为业务错误并回滚', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      // 初始化缓存（需与 useStrategy mock 的 activeChannel 一致）
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId, 'waba'),
        {
          pages: [{ items: [] }],
        },
      );

      // Mock 后端返回失败，但没有设置 errorType 和 retryable
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: '发送失败',
      });

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversationId,
          content,
        });
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证：缓存应该回滚到空列表
      const data = queryClient.getQueryData<{
        pages: Array<{ items: unknown[] }>;
      }>(queryKeys.messages.list(conversationId, 'waba'));

      expect(data?.pages[0].items).toHaveLength(0);
    });
  });

  describe('成功场景', () => {
    it('应该正常更新消息状态', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const messageId = 'real-msg-1';

      // Mock 后端返回成功
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        messageId,
        status: MessageStatusEnum.Sent,
      });

      // 发送消息
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          conversationId,
          content,
        });
      });

      // 等待异步操作完成
      await waitFor(() => {
        expect(mockMessageService.send).toHaveBeenCalled();
      });

      // 验证消息状态更新为 Sent（需与 useStrategy mock 的 activeChannel 一致）
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ id: string; status: string }> }>;
      }>(queryKeys.messages.list(conversationId, 'waba'));

      expect(data?.pages[0].items[0].id).toBe(messageId);
      expect(data?.pages[0].items[0].status).toBe(MessageStatusEnum.Sent);
    });
  });
});
