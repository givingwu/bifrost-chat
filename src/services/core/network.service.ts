import type { NetworkState } from '@/interfaces/network.interface';

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
