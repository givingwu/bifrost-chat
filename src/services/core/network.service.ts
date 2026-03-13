import { ConnectionStateEnum } from '@/interfaces/connection.interface';
import {
  NetworkQualityEnum,
  type NetworkQualityMetrics,
  NetworkReachabilityEnum,
  type NetworkState,
  NetworkStatusEnum,
} from '@/interfaces/network.interface';
import { WebSocketStatusEnum } from '@/interfaces/websocket.interface';

/**
 * 网络状态服务接口
 *
 * @description
 * 由 Host 聚合浏览器、HTTP、WebSocket/SSE 等网络事实后注入 SDK。
 * SDK 只消费快照并同步到本地状态，不自行推断最终网络状态。
 */
export interface INetworkService {
  /**
   * 获取当前网络状态快照
   */
  getSnapshot(): NetworkState;

  /**
   * 订阅网络状态变化
   * @param listener 状态变化回调
   * @returns 取消订阅函数
   */
  subscribe(listener: (state: NetworkState) => void): () => void;

  /**
   * 主动触发重连
   */
  reconnect?(): Promise<void>;
}

export type RealtimeNetworkStatus =
  | ConnectionStateEnum
  | NetworkStatusEnum
  | WebSocketStatusEnum;

export interface BrowserNetworkRealtimeSource {
  /**
   * 读取实时连接状态，例如 WebSocket / SSE。
   */
  getStatus?: () => RealtimeNetworkStatus | undefined;
  /**
   * 订阅实时连接状态变化。
   */
  subscribe?: (
    listener: (status: RealtimeNetworkStatus) => void,
  ) => (() => void) | void;
}

export interface BrowserNetworkServiceOptions {
  /**
   * 是否显示网络状态指示器。
   * 默认开启，确保注入后即可展示 NetworkStatus。
   */
  enableStatusIndicator?: boolean;
  /**
   * Host 提供的主动重连逻辑。
   */
  reconnect?: () => Promise<void>;
  /**
   * 可选的实时连接状态源，例如 WebSocketManager。
   */
  realtime?: BrowserNetworkRealtimeSource;
}

interface BrowserConnectionInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: BrowserConnectionInformation;
  mozConnection?: BrowserConnectionInformation;
  webkitConnection?: BrowserConnectionInformation;
}

function getNavigatorSafe(): NavigatorWithConnection | undefined {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator as NavigatorWithConnection;
}

function getConnectionInfo(): BrowserConnectionInformation | undefined {
  const browserNavigator = getNavigatorSafe();

  return (
    browserNavigator?.connection ??
    browserNavigator?.mozConnection ??
    browserNavigator?.webkitConnection
  );
}

function getBrowserOnline(): boolean | undefined {
  const browserNavigator = getNavigatorSafe();

  if (typeof browserNavigator?.onLine !== 'boolean') {
    return undefined;
  }

  return browserNavigator.onLine;
}

function resolveReachability(
  browserOnline: boolean | undefined,
): NetworkReachabilityEnum {
  if (browserOnline === true) {
    return NetworkReachabilityEnum.Online;
  }

  if (browserOnline === false) {
    return NetworkReachabilityEnum.Offline;
  }

  return NetworkReachabilityEnum.Unknown;
}

function resolveQuality(
  connection: BrowserConnectionInformation | undefined,
): NetworkQualityEnum {
  const effectiveType = connection?.effectiveType?.toLowerCase();

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return NetworkQualityEnum.Poor;
  }

  if (effectiveType === '3g') {
    return NetworkQualityEnum.Fair;
  }

  if (effectiveType === '4g') {
    if (typeof connection?.downlink === 'number' && connection.downlink >= 8) {
      return NetworkQualityEnum.Excellent;
    }
    return NetworkQualityEnum.Good;
  }

  if (typeof connection?.downlink === 'number') {
    if (connection.downlink >= 8) {
      return NetworkQualityEnum.Excellent;
    }
    if (connection.downlink >= 3) {
      return NetworkQualityEnum.Good;
    }
    if (connection.downlink >= 1) {
      return NetworkQualityEnum.Fair;
    }
    return NetworkQualityEnum.Poor;
  }

  return NetworkQualityEnum.Unknown;
}

function resolveMetrics(
  connection: BrowserConnectionInformation | undefined,
): NetworkQualityMetrics | undefined {
  if (
    typeof connection?.downlink !== 'number' &&
    typeof connection?.rtt !== 'number'
  ) {
    return undefined;
  }

  return {
    bandwidth:
      typeof connection?.downlink === 'number'
        ? connection.downlink * 1024
        : undefined,
    latency: typeof connection?.rtt === 'number' ? connection.rtt : 0,
  };
}

function toNetworkStatus(
  status: RealtimeNetworkStatus | undefined,
): NetworkStatusEnum | undefined {
  if (!status) {
    return undefined;
  }

  switch (status) {
    case ConnectionStateEnum.Connected:
    case NetworkStatusEnum.Connected:
    case WebSocketStatusEnum.Connected:
      return NetworkStatusEnum.Connected;
    case ConnectionStateEnum.Connecting:
    case NetworkStatusEnum.Connecting:
    case WebSocketStatusEnum.Connecting:
      return NetworkStatusEnum.Connecting;
    case ConnectionStateEnum.Disconnected:
    case NetworkStatusEnum.Disconnected:
    case WebSocketStatusEnum.Disconnected:
    case WebSocketStatusEnum.Error:
      return NetworkStatusEnum.Disconnected;
    case ConnectionStateEnum.Reconnecting:
    case NetworkStatusEnum.Reconnecting:
      return NetworkStatusEnum.Reconnecting;
    default:
      return undefined;
  }
}

function resolveStatus(
  browserOnline: boolean | undefined,
  realtimeStatus: RealtimeNetworkStatus | undefined,
): NetworkStatusEnum {
  if (browserOnline === false) {
    return NetworkStatusEnum.Disconnected;
  }

  const resolvedRealtimeStatus = toNetworkStatus(realtimeStatus);

  if (resolvedRealtimeStatus) {
    return resolvedRealtimeStatus;
  }

  if (browserOnline === true) {
    return NetworkStatusEnum.Connected;
  }

  return NetworkStatusEnum.Unknown;
}

function isRealtimeConnected(
  realtimeStatus: RealtimeNetworkStatus | undefined,
): boolean | undefined {
  const resolvedRealtimeStatus = toNetworkStatus(realtimeStatus);

  if (!resolvedRealtimeStatus) {
    return undefined;
  }

  return resolvedRealtimeStatus === NetworkStatusEnum.Connected;
}

function mergeSnapshot(
  current: NetworkState,
  next: NetworkState,
): NetworkState | undefined {
  const currentDetails = current.details ?? {};
  const nextDetails = next.details ?? {};
  const currentMetrics = current.metrics;
  const nextMetrics = next.metrics;

  const isSame =
    current.status === next.status &&
    current.reachability === next.reachability &&
    current.quality === next.quality &&
    current.error === next.error &&
    current.lastConnectedAt === next.lastConnectedAt &&
    current.reconnectCount === next.reconnectCount &&
    current.enableStatusIndicator === next.enableStatusIndicator &&
    currentDetails.browserOnline === nextDetails.browserOnline &&
    currentDetails.httpReachable === nextDetails.httpReachable &&
    currentDetails.realtimeConnected === nextDetails.realtimeConnected &&
    currentMetrics?.latency === nextMetrics?.latency &&
    currentMetrics?.bandwidth === nextMetrics?.bandwidth &&
    currentMetrics?.jitter === nextMetrics?.jitter &&
    currentMetrics?.packetLoss === nextMetrics?.packetLoss;

  return isSame ? undefined : next;
}

/**
 * BrowserNetworkService
 *
 * @description
 * SDK 默认浏览器网络状态服务：
 * - 聚合 `navigator.onLine`
 * - 监听 `window` 的 `online/offline` 事件
 * - 可选接入 WebSocket/SSE 等实时连接状态源
 */
export class BrowserNetworkService implements INetworkService {
  private readonly listeners = new Set<(state: NetworkState) => void>();
  private readonly cleanupFns: Array<() => void> = [];
  private readonly options: BrowserNetworkServiceOptions;
  private snapshot: NetworkState;
  private realtimeStatus: RealtimeNetworkStatus | undefined;

  constructor(options: BrowserNetworkServiceOptions = {}) {
    this.options = options;
    this.realtimeStatus = options.realtime?.getStatus?.();
    this.snapshot = this.createSnapshot();
    this.setupBrowserListeners();
    this.setupRealtimeListeners();
  }

  getSnapshot(): NetworkState {
    return this.snapshot;
  }

  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async reconnect(): Promise<void> {
    await this.options.reconnect?.();
  }

  /**
   * 手动释放监听器，供宿主在销毁 Service 单例时调用。
   */
  destroy(): void {
    for (const cleanup of this.cleanupFns.splice(0)) {
      cleanup();
    }
    this.listeners.clear();
  }

  private setupBrowserListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBrowserChange = () => {
      this.refreshSnapshot();
    };

    window.addEventListener('online', handleBrowserChange);
    window.addEventListener('offline', handleBrowserChange);
    this.cleanupFns.push(() => {
      window.removeEventListener('online', handleBrowserChange);
      window.removeEventListener('offline', handleBrowserChange);
    });

    const connection = getConnectionInfo();

    if (!connection?.addEventListener || !connection?.removeEventListener) {
      return;
    }

    connection.addEventListener('change', handleBrowserChange);
    this.cleanupFns.push(() => {
      connection.removeEventListener?.('change', handleBrowserChange);
    });
  }

  private setupRealtimeListeners(): void {
    const unsubscribe = this.options.realtime?.subscribe?.((status) => {
      this.realtimeStatus = status;
      this.refreshSnapshot();
    });

    if (typeof unsubscribe === 'function') {
      this.cleanupFns.push(unsubscribe);
    }
  }

  private refreshSnapshot(): void {
    const nextSnapshot = this.createSnapshot();
    const changedSnapshot = mergeSnapshot(this.snapshot, nextSnapshot);

    if (!changedSnapshot) {
      return;
    }

    this.snapshot = changedSnapshot;
    this.notifyListeners();
  }

  private createSnapshot(): NetworkState {
    const browserOnline = getBrowserOnline();
    const connection = getConnectionInfo();
    const status = resolveStatus(browserOnline, this.realtimeStatus);
    const wasConnected =
      this.snapshot?.status === NetworkStatusEnum.Connected &&
      typeof this.snapshot.lastConnectedAt === 'number';
    const lastConnectedAt =
      status === NetworkStatusEnum.Connected
        ? wasConnected
          ? this.snapshot.lastConnectedAt
          : Date.now()
        : undefined;

    return {
      status,
      reachability: resolveReachability(browserOnline),
      quality: resolveQuality(connection),
      metrics: resolveMetrics(connection),
      enableStatusIndicator: this.options.enableStatusIndicator ?? true,
      lastConnectedAt,
      details: {
        browserOnline,
        httpReachable:
          browserOnline === false
            ? false
            : browserOnline === true
              ? true
              : undefined,
        realtimeConnected: isRealtimeConnected(this.realtimeStatus),
      },
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}

export function createBrowserNetworkService(
  options?: BrowserNetworkServiceOptions,
): BrowserNetworkService {
  return new BrowserNetworkService(options);
}
