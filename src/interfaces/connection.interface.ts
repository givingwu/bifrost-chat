/**
 * 连接管理接口
 * - 支持连接管理的适配器应实现此接口
 */
export interface IConnectionManager {
  /**
   * 连接到服务端
   */
  connect(): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 重新连接
   */
  reconnect(): Promise<void>;

  /**
   * 检查是否已连接
   */
  isConnected(): boolean;

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState;
}

/**
 * 连接状态
 */
export enum ConnectionStateEnum {
  /** 已连接 */
  Connected = 'connected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 已断开 */
  Disconnected = 'disconnected',
  /** 重连中 */
  Reconnecting = 'reconnecting',
}

/**
 * 连接状态详情
 */
export interface ConnectionState {
  /** 状态 */
  status: ConnectionStateEnum;
  /** 最后连接时间 */
  lastConnectedAt?: number;
  /** 重试次数 */
  retryCount?: number;
}
