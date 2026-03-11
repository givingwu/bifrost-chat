import { onlineManager } from '@tanstack/react-query';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopbarTools } from '@/components/toolbar/TopbarTools';
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
import { useChatStore, useNetwork } from '@/store';
import { DEFAULT_NETWORK_STATE } from '@/store/slices/network.slice';

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

const mockMessageService: IMessageService = {
  list: vi.fn(),
  send: vi.fn(),
  markAsRead: vi.fn(),
  subscribeToMessages: vi.fn(() => () => {}),
  subscribeToMessageStatus: vi.fn(() => () => {}),
  sendAttachment: vi.fn(),
  sendAudio: vi.fn(),
};

const offlineSnapshot: NetworkState = {
  status: NetworkStatusEnum.Disconnected,
  reachability: NetworkReachabilityEnum.Offline,
  quality: NetworkQualityEnum.Poor,
  enableStatusIndicator: true,
  error: 'socket closed',
  details: {
    browserOnline: false,
    httpReachable: false,
    realtimeConnected: false,
  },
};

const onlineSnapshot: NetworkState = {
  status: NetworkStatusEnum.Reconnecting,
  reachability: NetworkReachabilityEnum.Online,
  quality: NetworkQualityEnum.Good,
  enableStatusIndicator: true,
  lastConnectedAt: Date.now(),
  details: {
    browserOnline: true,
    httpReachable: true,
    realtimeConnected: false,
  },
};

function createWrapper(networkService?: INetworkService) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ServiceProvider
        conversationService={mockConversationService}
        messageService={mockMessageService}
        templateService={mockTemplateService}
        networkService={networkService}
      >
        {children}
      </ServiceProvider>
    );
  };
}

describe('ServiceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().actions.replaceNetwork(DEFAULT_NETWORK_STATE);
    onlineManager.setOnline(true);
  });

  afterEach(() => {
    useChatStore.getState().actions.replaceNetwork(DEFAULT_NETWORK_STATE);
    onlineManager.setOnline(true);
  });

  it('应同步 Host 网络快照到 store 与 onlineManager', async () => {
    let listener: ((state: NetworkState) => void) | undefined;
    const unsubscribe = vi.fn();

    const networkService: INetworkService = {
      getSnapshot: vi.fn(() => offlineSnapshot),
      subscribe: vi.fn((callback) => {
        listener = callback;
        return unsubscribe;
      }),
    };

    const { result, unmount } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(networkService),
    });

    await waitFor(() => {
      expect(result.current.status).toBe(NetworkStatusEnum.Disconnected);
    });

    expect(result.current.reachability).toBe(NetworkReachabilityEnum.Offline);
    expect(result.current.error).toBe('socket closed');
    expect(onlineManager.isOnline()).toBe(false);

    act(() => {
      listener?.(onlineSnapshot);
    });

    await waitFor(() => {
      expect(result.current.status).toBe(NetworkStatusEnum.Reconnecting);
    });

    expect(result.current.reachability).toBe(NetworkReachabilityEnum.Online);
    expect(result.current.error).toBeUndefined();
    expect(onlineManager.isOnline()).toBe(true);

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('未注入 networkService 时不显示网络状态', () => {
    render(<TopbarTools />);

    expect(screen.queryByLabelText('网络已连接')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('网络状态未知')).not.toBeInTheDocument();
  });
});
