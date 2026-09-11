import type { MessagePriorityEnum, StandardMessage } from './message.interface';

/**
 * 离线消息接口
 *
 * @description
 * 表示存储在离线队列中的消息，包含原始消息数据和重试信息
 */
export interface OfflineMessage {
  /** 唯一标识（UUID） */
  id: string;
  /** 原始消息数据（不包含 id 和 status） */
  message: Omit<StandardMessage, 'id' | 'status'>;
  /** 会话 ID */
  conversationId: string;
  /** 发送参数（包含 extra 数据） */
  sendParams: Record<string, unknown>;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 失败原因 */
  error?: string;
  /** 创建时间（时间戳） */
  createdAt: number;
  /** 最后重试时间（时间戳） */
  lastRetryAt?: number;
  /** 下次重试时间（时间戳） */
  nextRetryAt?: number;
  /** 消息优先级 */
  priority: MessagePriorityEnum;
}

/**
 * 离线消息队列统计信息
 */
export interface OfflineQueueStats {
  /** 总消息数 */
  total: number;
  /** 按会话分组的消息数 */
  byConversation: Record<string, number>;
  /** 按优先级分组的消息数 */
  byPriority: Record<MessagePriorityEnum, number>;
  /** 最旧消息的创建时间 */
  oldestMessageAt?: number;
  /** 最新消息的创建时间 */
  newestMessageAt?: number;
}

/**
 * 离线消息队列配置
 */
export interface OfflineQueueConfig {
  /** 是否启用离线队列 */
  enabled: boolean;
  /** 数据库名称 */
  dbName?: string;
  /** 数据库版本 */
  dbVersion?: number;
  /** 最大队列长度 */
  maxQueueSize?: number;
  /** 消息过期时间（毫秒），默认 7 天 */
  messageExpiration?: number;
  /** 默认最大重试次数，默认 3 */
  defaultMaxRetries?: number;
  /** 重试延迟策略 */
  retryStrategy?: 'exponential' | 'linear' | 'fixed';
  /** 是否在网络恢复时自动重试 */
  autoRetryOnReconnect?: boolean;
  /** 批量重试大小 */
  batchSize?: number;
  /** 固定重试延迟（毫秒），用于 fixed 策略 */
  fixedRetryDelay?: number;
  /** 线性重试延迟增量（毫秒），用于 linear 策略 */
  linearRetryDelay?: number;
  /** 指数退避最大延迟（毫秒） */
  maxRetryDelay?: number;
}
