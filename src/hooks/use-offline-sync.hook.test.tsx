import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import {
  NetworkQualityEnum,
  NetworkReachabilityEnum,
  type NetworkState,
  NetworkStatusEnum,
} from '@/interfaces/network.interface';
import { ServiceProvider } from '@/providers/service.provider';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { INetworkService } from '@/services/core/network.service';
import type { ITemplateService } from '@/services/core/template.service';
import { useChatStore } from '@/store';
import { DEFAULT_NETWORK_STATE } from '@/store/slices/network.slice';
import { useOfflineSync } from './use-offline-sync.hook';

const mockConversationService: IConversationService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  query: vi.fn(),
};

const mockTemplateService: ITemplateService = {
  list: vi.fn(),
  preview: vi.fn(),
};

const mockSend = vi.fn();

const mockMessageService: IMessageService = {
  list: vi.fn(),
  send: mockSend,
  markAsRead: vi.fn(),
  subscribeToMessages: vi.fn(() => () => {}),
  subscribeToMessageStatus: vi.fn(() => () => {}),
  sendAttachment: vi.fn(),
  sendAudio: vi.fn(),
};

const mockOfflineMessageQueue = {
  getPendingRetry: vi.fn(),
  dequeue: vi.fn(),
  update: vi.fn(),
  calculateNextRetry: vi.fn(),
};

const offlineSnapshot: NetworkState = {
  status: NetworkStatusEnum.Disconnected,
  reachability: NetworkReachabilityEnum.Offline,
  quality: NetworkQualityEnum.Unknown,
  enableStatusIndicator: false,
};

const onlineSnapshot: NetworkState = {
  status: NetworkStatusEnum.Connected,
  reachability: NetworkReachabilityEnum.Online,
  quality: NetworkQualityEnum.Good,
  enableStatusIndicator: true,
};

function createWrapper(
  queryClient: QueryClient,
  networkService?: INetworkService,
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider
          conversationService={mockConversationService}
          messageService={mockMessageService}
          templateService={mockTemplateService}
          offlineMessageQueue={mockOfflineMessageQueue as never}
          networkService={networkService}
        >
          {children}
        </ServiceProvider>
      </QueryClientProvider>
    );
  };
}

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().actions.replaceNetwork(DEFAULT_NETWORK_STATE);

    mockOfflineMessageQueue.getPendingRetry.mockResolvedValue([
      {
        id: 'offline-1',
        conversationId: 'conv-1',
        sendParams: { content: 'hello' },
        retryCount: 0,
        maxRetries: 3,
      },
    ]);
    mockOfflineMessageQueue.dequeue.mockResolvedValue(undefined);
    mockOfflineMessageQueue.update.mockResolvedValue(undefined);
    mockSend.mockResolvedValue({
      tempId: 'temp-1',
      messageId: 'server-1',
      status: MessageStatusEnum.Sent,
    });
  });

  it('应在 Host 网络从 Offline 切换到 Online 时自动同步离线消息', async () => {
    let listener: ((state: NetworkState) => void) | undefined;
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const networkService: INetworkService = {
      getSnapshot: vi.fn(() => offlineSnapshot),
      subscribe: vi.fn((callback) => {
        listener = callback;
        return () => {};
      }),
    };

    renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(queryClient, networkService),
    });

    act(() => {
      listener?.(onlineSnapshot);
    });

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1100);
      });
    });

    await waitFor(() => {
      expect(mockOfflineMessageQueue.getPendingRetry).toHaveBeenCalledTimes(1);
    });

    expect(mockSend).toHaveBeenCalledWith('conv-1', {
      content: 'hello',
    });
    expect(mockOfflineMessageQueue.dequeue).toHaveBeenCalledWith('offline-1');
  });

  it('未注入 networkService 时不应自动同步离线消息', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    expect(mockOfflineMessageQueue.getPendingRetry).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });
});
