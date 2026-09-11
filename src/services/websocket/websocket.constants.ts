/**
 * WebSocket Manager 常量配置
 *
 * @description
 * 集中管理 WebSocket 相关的常量配置，提高可维护性
 */

/**
 * WebSocket 默认配置
 */
export const WEBSOCKET_DEFAULT_CONFIG = {
  /** 默认心跳间隔（毫秒） */
  HEARTBEAT_INTERVAL: 30000,
  /** 默认重连间隔（毫秒） */
  RECONNECT_INTERVAL: 3000,
  /** 默认最大重连次数 */
  MAX_RECONNECT_ATTEMPTS: 10,
  /** 默认连接超时（毫秒） */
  CONNECTION_TIMEOUT: 10000,
  /** 默认是否自动重连 */
  AUTO_RECONNECT: true,
  /** 默认是否启用协议转换 */
  ENABLE_PROTOCOL_CONVERSION: true,
} as const;

/**
 * WebSocket 错误类型
 */
export const WEBSOCKET_ERROR_TYPES = {
  /** 连接超时 */
  CONNECTION_TIMEOUT: 'ConnectionTimeout',
  /** 连接失败 */
  CONNECTION_FAILED: 'ConnectionFailed',
  /** 发送失败 */
  SEND_FAILED: 'SendFailed',
  /** 解析错误 */
  PARSE_ERROR: 'ParseError',
  /** 验证错误 */
  VALIDATION_ERROR: 'ValidationError',
  /** 认证失败 */
  AUTH_FAILED: 'AuthFailed',
  /** 配置错误 */
  CONFIGURATION_ERROR: 'ConfigurationError',
} as const;

/**
 * WebSocket 错误消息
 */
export const WEBSOCKET_ERROR_MESSAGES = {
  [WEBSOCKET_ERROR_TYPES.CONNECTION_TIMEOUT]: 'Connection timeout',
  [WEBSOCKET_ERROR_TYPES.CONNECTION_FAILED]: 'Connection failed',
  [WEBSOCKET_ERROR_TYPES.SEND_FAILED]: 'Failed to send message',
  [WEBSOCKET_ERROR_TYPES.PARSE_ERROR]: 'Failed to parse message',
  [WEBSOCKET_ERROR_TYPES.VALIDATION_ERROR]:
    'Invalid packet: missing or invalid ptype field',
  [WEBSOCKET_ERROR_TYPES.AUTH_FAILED]: 'Authentication failed',
  [WEBSOCKET_ERROR_TYPES.CONFIGURATION_ERROR]: 'Invalid configuration',
} as const;

/**
 * 协议消息类型优先级
 *
 * @description
 * 用于定义消息处理的优先级顺序
 * 数字越小，优先级越高
 */
export const PACKET_TYPE_PRIORITY = {
  /** 登录失败 - 最高优先级 */
  AUTH_FAIL: 1,
  /** 聊天消息 */
  CHAT_MESSAGE: 2,
  /** ACK 消息 */
  ACK: 3,
  /** 心跳 */
  HEARTBEAT: 4,
  /** 状态切换 */
  STATUS_SWITCH: 5,
  /** 触达回复消息发送结果 */
  FOX_MESSAGE_ACK: 6,
} as const;

/**
 * WebSocket 状态转换映射
 *
 * @description
 * 定义合法的状态转换，用于状态机验证
 */
export const WEBSOCKET_STATE_TRANSITIONS: Record<
  WebSocketStatus,
  readonly WebSocketStatus[]
> = {
  connecting: ['connected', 'disconnected', 'error'],
  connected: ['disconnected', 'error'],
  disconnected: ['connecting'],
  error: ['connecting', 'disconnected'],
} as const;

/**
 * WebSocket 状态类型
 */
export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/**
 * 获取合法的下一个状态
 *
 * @param currentState 当前状态
 * @param nextState 目标状态
 * @returns 是否为合法的状态转换
 */
export function isValidStateTransition(
  currentState: WebSocketStatus,
  nextState: WebSocketStatus,
): boolean {
  return WEBSOCKET_STATE_TRANSITIONS[currentState].includes(nextState);
}
