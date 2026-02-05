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

/**
 * Network Slice：网络连接状态
 */
export interface NetworkState {
  /** 连接状态 */
  status: NetworkStatusEnum;
}
