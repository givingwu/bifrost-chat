import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionStateEnum } from '@/interfaces/connection.interface';
import {
  NetworkQualityEnum,
  NetworkReachabilityEnum,
  NetworkStatusEnum,
} from '@/interfaces/network.interface';
import { createBrowserNetworkService } from './network.service';

const originalOnLineDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  'onLine',
);
const originalConnectionDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  'connection',
);

let browserOnline = true;
let connectionChangeListener: (() => void) | undefined;

const mockConnection = {
  effectiveType: '4g',
  downlink: 12,
  rtt: 80,
  addEventListener: vi.fn((type: 'change', listener: () => void) => {
    if (type === 'change') {
      connectionChangeListener = listener;
    }
  }),
  removeEventListener: vi.fn(),
};

function restoreNavigatorProperty(
  key: 'onLine' | 'connection',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(window.navigator, key, descriptor);
    return;
  }

  Reflect.deleteProperty(window.navigator, key);
}

describe('BrowserNetworkService', () => {
  beforeEach(() => {
    browserOnline = true;
    connectionChangeListener = undefined;
    mockConnection.addEventListener.mockClear();
    mockConnection.removeEventListener.mockClear();

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => browserOnline,
    });

    Object.defineProperty(window.navigator, 'connection', {
      configurable: true,
      value: mockConnection,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreNavigatorProperty('onLine', originalOnLineDescriptor);
    restoreNavigatorProperty('connection', originalConnectionDescriptor);
  });

  it('浏览器在线时应返回可展示的默认网络快照', () => {
    const service = createBrowserNetworkService();
    const snapshot = service.getSnapshot();

    expect(snapshot.enableStatusIndicator).toBe(true);
    expect(snapshot.status).toBe(NetworkStatusEnum.Connected);
    expect(snapshot.reachability).toBe(NetworkReachabilityEnum.Online);
    expect(snapshot.quality).toBe(NetworkQualityEnum.Excellent);
    expect(snapshot.details).toEqual({
      browserOnline: true,
      httpReachable: true,
      realtimeConnected: undefined,
    });

    service.destroy();
  });

  it('浏览器离线时应通知订阅者并切换为断开状态', () => {
    const service = createBrowserNetworkService();
    const listener = vi.fn();

    service.subscribe(listener);

    browserOnline = false;
    window.dispatchEvent(new Event('offline'));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NetworkStatusEnum.Disconnected,
        reachability: NetworkReachabilityEnum.Offline,
        details: expect.objectContaining({
          browserOnline: false,
          httpReachable: false,
        }),
      }),
    );

    service.destroy();
  });

  it('接入 realtime 状态源后应优先展示实时连接状态', () => {
    let currentStatus = ConnectionStateEnum.Connecting;
    let realtimeListener: ((status: ConnectionStateEnum) => void) | undefined;

    const service = createBrowserNetworkService({
      realtime: {
        getStatus: () => currentStatus,
        subscribe: (listener) => {
          realtimeListener = listener as (status: ConnectionStateEnum) => void;
          return () => {
            realtimeListener = undefined;
          };
        },
      },
    });

    expect(service.getSnapshot().status).toBe(NetworkStatusEnum.Connecting);

    currentStatus = ConnectionStateEnum.Connected;
    realtimeListener?.(ConnectionStateEnum.Connected);

    expect(service.getSnapshot().status).toBe(NetworkStatusEnum.Connected);
    expect(service.getSnapshot().details?.realtimeConnected).toBe(true);

    currentStatus = ConnectionStateEnum.Disconnected;
    realtimeListener?.(ConnectionStateEnum.Disconnected);

    expect(service.getSnapshot().status).toBe(NetworkStatusEnum.Disconnected);
    expect(service.getSnapshot().details?.realtimeConnected).toBe(false);

    service.destroy();
  });

  it('网络信息变化时应刷新质量指标', () => {
    const service = createBrowserNetworkService();

    mockConnection.effectiveType = '3g';
    mockConnection.downlink = 1.5;
    connectionChangeListener?.();

    expect(service.getSnapshot().quality).toBe(NetworkQualityEnum.Fair);
    expect(service.getSnapshot().metrics).toEqual({
      bandwidth: 1536,
      latency: 80,
    });

    service.destroy();
  });

  it('单个监听器抛错时不应影响其他监听器', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
        return undefined;
      });
    const service = createBrowserNetworkService();
    const healthyListener = vi.fn();

    service.subscribe(() => {
      throw new Error('listener failed');
    });
    service.subscribe(healthyListener);

    browserOnline = false;
    window.dispatchEvent(new Event('offline'));

    expect(healthyListener).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NetworkStatusEnum.Disconnected,
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[BrowserNetworkService] Listener callback failed:',
      expect.any(Error),
    );

    service.destroy();
  });

  it('destroy 后不应再响应浏览器与 realtime 状态变化', () => {
    let realtimeListener: ((status: ConnectionStateEnum) => void) | undefined;
    const unsubscribeRealtime = vi.fn(() => {
      realtimeListener = undefined;
    });
    const service = createBrowserNetworkService({
      realtime: {
        getStatus: () => ConnectionStateEnum.Connecting,
        subscribe: (listener) => {
          realtimeListener = listener as (status: ConnectionStateEnum) => void;
          return unsubscribeRealtime;
        },
      },
    });
    const listener = vi.fn();

    service.subscribe(listener);
    service.destroy();

    browserOnline = false;
    window.dispatchEvent(new Event('offline'));
    realtimeListener?.(ConnectionStateEnum.Connected);

    expect(listener).not.toHaveBeenCalled();
    expect(unsubscribeRealtime).toHaveBeenCalledTimes(1);
    expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
