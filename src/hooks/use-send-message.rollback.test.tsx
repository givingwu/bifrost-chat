import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSendMessage } from '@/hooks/use-send-message.hook';
import {
  MessageFailureTypeEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

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
      sender: { id: options.senderId },
      receiver: { id: options.receiverId },
    })),
    generateUniqueId: vi.fn(() => 'offline-msg-1'),
  },
}));

describe('useSendMessage - 消息回填功能测试', () => {
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

  describe('不可重试错误（业务逻辑错误）', () => {
    it('应该撤回消息并触发回填事件', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const errorMessage = '已达到发送次数上限';

      // Mock 后端返回不可重试错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        errorType: MessageFailureTypeEnum.Quota,
        retryable: false,
      });

      // 监听回填事件
      const eventListener = vi.fn();
      window.addEventListener('messageSendFailed', eventListener);

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

      // 验证没有保存到离线队列
      expect(mockOfflineMessageQueue.enqueue).not.toHaveBeenCalled();

      // 验证触发了回填事件
      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({
        conversationId,
        content,
        templateId: undefined,
        error: errorMessage,
      });

      // 清理
      window.removeEventListener('messageSendFailed', eventListener);
    });

    it('应该从缓存中删除失败的消息', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      // Mock 后端返回不可重试错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: '验证失败',
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

      // 验证消息从缓存中删除
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ tempId: string }> }>;
      }>(['messages', 'list', conversationId]);

      // 缓存结构应该存在，但 items 应该为空数组（消息被删除）
      expect(data).toBeDefined();
      expect(data?.pages[0].items).toHaveLength(0);
    });
  });

  describe('非 Sent 状态（即便标记可重试）', () => {
    it('应该撤回消息并触发回填事件', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';
      const errorMessage = '网络连接失败';

      // Mock 后端返回可重试错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        errorType: MessageFailureTypeEnum.Network,
        retryable: true,
      });

      // 监听回填事件
      const eventListener = vi.fn();
      window.addEventListener('messageSendFailed', eventListener);

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

      // 验证非 Sent 不入离线队列
      expect(mockOfflineMessageQueue.enqueue).not.toHaveBeenCalled();
      // 验证触发回填事件
      expect(eventListener).toHaveBeenCalled();

      // 清理
      window.removeEventListener('messageSendFailed', eventListener);
    });

    it('应该从缓存中删除消息', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      // Mock 后端返回可重试错误
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: '服务器错误',
        errorType: MessageFailureTypeEnum.Network,
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

      // 验证消息从缓存中删除
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ tempId: string }> }>;
      }>(['messages', 'list', conversationId]);

      expect(data).toBeDefined();
      expect(data?.pages[0].items).toHaveLength(0);
    });
  });

  describe('异常抛出场景（onError）', () => {
    it('应该写入离线队列并回写 _offlineMessageId 供 retry 使用', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      mockMessageService.send.mockRejectedValue(new Error('网络连接失败'));

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            conversationId,
            content,
          }),
        ).rejects.toThrow('网络连接失败');
      });

      await waitFor(() => {
        expect(mockOfflineMessageQueue.enqueue).toHaveBeenCalled();
      });

      const data = queryClient.getQueryData<{
        pages: Array<{
          items: Array<{
            status: string;
            _source?: string;
            _offlineMessageId?: string;
            error?: string;
          }>;
        }>;
      }>(['messages', 'list', conversationId]);

      expect(data?.pages[0].items[0].status).toBe(MessageStatusEnum.Failed);
      expect(data?.pages[0].items[0]._source).toBe('local');
      expect(data?.pages[0].items[0]._offlineMessageId).toBe('offline-msg-1');
      expect(data?.pages[0].items[0].error).toBe('网络连接失败');
    });
  });

  describe('向后兼容性测试', () => {
    it('当没有设置 errorType 和 retryable 时，默认为不可重试', async () => {
      const conversationId = 'conv-1';
      const content = '测试消息';

      // Mock 后端返回失败，但没有设置 errorType 和 retryable
      mockMessageService.send.mockResolvedValue({
        tempId: 'temp-msg-1',
        status: MessageStatusEnum.Failed,
        error: '发送失败',
      });

      // 监听回填事件
      const eventListener = vi.fn();
      window.addEventListener('messageSendFailed', eventListener);

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

      // 验证默认行为是触发回填事件（不可重试）
      expect(eventListener).toHaveBeenCalled();

      // 清理
      window.removeEventListener('messageSendFailed', eventListener);
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

      // 验证消息状态更新为 Sent
      const data = queryClient.getQueryData<{
        pages: Array<{ items: Array<{ id: string; status: string }> }>;
      }>(['messages', 'list', conversationId]);

      expect(data?.pages[0].items[0].id).toBe(messageId);
      expect(data?.pages[0].items[0].status).toBe(MessageStatusEnum.Sent);
    });
  });
});
