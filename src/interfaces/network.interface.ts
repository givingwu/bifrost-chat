/**
 * 网络连接状态枚举
 */
export enum NetworkStatusEnum {
  /** 连接成功 */
  Connected = 'connected',
  /** 连接断开 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
}

// 向后兼容：导出类型别名
export type NetworkStatus = NetworkStatusEnum;

/**
 * Network Slice：网络连接状态
 */
export interface NetworkState {
  /** 连接状态 */
  status: NetworkStatusEnum;
}
