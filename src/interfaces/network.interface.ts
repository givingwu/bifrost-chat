/**
 * 网络连接状态枚举
 */
export enum NetworkStatusEnum {
  /** 状态未知 */
  Unknown = 'unknown',
  /** 连接成功 */
  Connected = 'connected',
  /** 连接断开 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 重连中 */
  Reconnecting = 'reconnecting',
}

/**
 * 网络可达性枚举
 */
export enum NetworkReachabilityEnum {
  /** 在线 */
  Online = 'online',
  /** 离线 */
  Offline = 'offline',
  /** 未知 */
  Unknown = 'unknown',
}

/**
 * 网络质量枚举
 */
export enum NetworkQualityEnum {
  /** 优秀 */
  Excellent = 'excellent',
  /** 良好 */
  Good = 'good',
  /** 一般 */
  Fair = 'fair',
  /** 较差 */
  Poor = 'poor',
  /** 未知 */
  Unknown = 'unknown',
}

/**
 * 网络协议类型
 */
export enum NetworkProtocolEnum {
  /** HTTP */
  HTTP = 'http',
  /** WebSocket */
  WebSocket = 'websocket',
  /** Server-Sent Events */
  SSE = 'sse',
  /** HTTP 长轮询 */
  LongPolling = 'long_polling',
}

/**
 * 网络错误类型
 */
export enum NetworkErrorCodeEnum {
  /** 未知错误 */
  Unknown = 'UNKNOWN',
  /** 连接超时 */
  Timeout = 'TIMEOUT',
  /** 连接被拒绝 */
  ConnectionRefused = 'CONNECTION_REFUSED',
  /** 网络不可达 */
  NetworkUnreachable = 'NETWORK_UNREACHABLE',
  /** 服务器错误 */
  ServerError = 'SERVER_ERROR',
  /** 客户端错误 */
  ClientError = 'CLIENT_ERROR',
}

/**
 * 网络配置
 */
export interface NetworkConfig {
  /** 协议类型 */
  protocol: NetworkProtocolEnum;
  /** 连接超时（毫秒） */
  connectionTimeout?: number;
  /** 请求超时（毫秒） */
  requestTimeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
}

/**
 * 网络质量指标
 */
export interface NetworkQualityMetrics {
  /** 延迟（毫秒） */
  latency: number;
  /** 丢包率（0-1） */
  packetLoss?: number;
  /** 带宽（Kbps） */
  bandwidth?: number;
  /** 抖动（毫秒） */
  jitter?: number;
}

/**
 * Network Slice：网络连接状态
 */
export interface NetworkState {
  /** 连接状态 */
  status: NetworkStatusEnum;
  /** 网络可达性 */
  reachability: NetworkReachabilityEnum;
  /** 网络质量 */
  quality: NetworkQualityEnum;
  /** 网络质量指标 */
  metrics?: NetworkQualityMetrics;
  /** 错误信息（如果断开） */
  error?: string;
  /** 最后连接时间 */
  lastConnectedAt?: number;
  /** 重连次数 */
  reconnectCount?: number;
  /** Host 汇总的连接细节 */
  details?: {
    browserOnline?: boolean;
    httpReachable?: boolean;
    realtimeConnected?: boolean;
  };
  /** 是否启用网络状态指示器 */
  enableStatusIndicator?: boolean;
}

/**
 * 网络事件类型
 */
export enum NetworkEventTypeEnum {
  /** 连接成功 */
  Connected = 'connected',
  /** 连接断开 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 重连中 */
  Reconnecting = 'reconnecting',
  /** 质量变化 */
  QualityChanged = 'quality_changed',
  /** 错误发生 */
  Error = 'error',
}
