import type { MessageStatusEnum } from '@/interfaces/message.interface';
import { MessagePriorityEnum } from '@/interfaces/message.interface';
import type {
  OfflineMessage,
  OfflineQueueConfig,
  OfflineQueueStats,
} from '@/interfaces/offline-message.interface';
import { generateUniqueId, IndexedDBHelper } from '@/utils/indexed-db.util';

/**
 * 离线消息队列服务
 *
 * @description
 * 管理离线消息队列，提供消息入队、出队、更新、查询等操作
 * 使用 IndexedDB 进行持久化存储
 */
export class OfflineMessageQueueService {
  private db: IndexedDBHelper;
  private config: OfflineQueueConfig;
  private subscribers: Set<(messages: OfflineMessage[]) => void> = new Set();
  private currentMessages: OfflineMessage[] = [];
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config: OfflineQueueConfig) {
    this.config = config;
    this.db = new IndexedDBHelper({
      dbName: config.dbName ?? 'bifrost-offline-queue',
      dbVersion: config.dbVersion ?? 1,
      stores: {
        offline_messages: {
          keyPath: 'id',
          indexes: [
            { name: 'conversationId', keyPath: 'conversationId' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'priority', keyPath: 'priority' },
            { name: 'nextRetryAt', keyPath: 'nextRetryAt' },
          ],
        },
      },
    });

    // 启动定期清理任务
    this.startCleanupTask();
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    await this.db.open();
    // 加载当前消息到内存
    this.currentMessages = await this.getAll();
  }

  /**
   * 将消息加入队列
   * @param message 离线消息
   * @throws {Error} 队列已满或存储失败
   */
  async enqueue(message: OfflineMessage): Promise<void> {
    // 检查队列是否已满
    const count = await this.db.count('offline_messages');
    const maxSize = this.config.maxQueueSize ?? 1000;
    if (count >= maxSize) {
      throw new Error(`Offline message queue is full (max: ${maxSize})`);
    }

    await this.db.add('offline_messages', message);
    this.currentMessages.push(message);
    this.notifySubscribers();
  }

  /**
   * 从队列中移除消息
   * @param messageId 消息 ID
   */
  async dequeue(messageId: string): Promise<void> {
    await this.db.delete('offline_messages', messageId);
    this.currentMessages = this.currentMessages.filter(
      (m) => m.id !== messageId,
    );
    this.notifySubscribers();
  }

  /**
   * 获取所有待发送的消息
   * @returns 消息列表（按优先级和创建时间排序）
   */
  async getAll(): Promise<OfflineMessage[]> {
    const messages = await this.db.getAll<OfflineMessage>('offline_messages');
    // 按优先级排序（高优先级在前）和创建时间排序（旧消息在前）
    return messages.sort((a, b) => {
      const priorityOrder: Record<MessagePriorityEnum, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
      };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * 获取指定会话的待发送消息
   * @param conversationId 会话 ID
   */
  async getByConversation(conversationId: string): Promise<OfflineMessage[]> {
    const messages = await this.db.getByIndex<OfflineMessage>(
      'offline_messages',
      'conversationId',
      conversationId,
    );
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * 获取需要重试的消息（nextRetryAt <= 当前时间）
   */
  async getPendingRetry(): Promise<OfflineMessage[]> {
    const now = Date.now();
    const messages = await this.db.getAll<OfflineMessage>('offline_messages');
    return messages
      .filter((m) => !m.nextRetryAt || m.nextRetryAt <= now)
      .sort((a, b) => {
        const priorityOrder: Record<MessagePriorityEnum, number> = {
          urgent: 0,
          high: 1,
          normal: 2,
          low: 3,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return (a.nextRetryAt ?? a.createdAt) - (b.nextRetryAt ?? b.createdAt);
      });
  }

  /**
   * 更新消息状态
   * @param messageId 消息 ID
   * @param updates 更新内容
   */
  async update(
    messageId: string,
    updates: Partial<OfflineMessage>,
  ): Promise<void> {
    const existing = await this.db.get<OfflineMessage>(
      'offline_messages',
      messageId,
    );
    if (!existing) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const updated = { ...existing, ...updates };
    await this.db.put('offline_messages', updated);

    // 更新内存中的消息
    const index = this.currentMessages.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      this.currentMessages[index] = updated;
    }
    this.notifySubscribers();
  }

  /**
   * 清空队列
   */
  async clear(): Promise<void> {
    await this.db.clear('offline_messages');
    this.currentMessages = [];
    this.notifySubscribers();
  }

  /**
   * 获取队列统计信息
   */
  async getStats(): Promise<OfflineQueueStats> {
    const messages = this.currentMessages;

    const byConversation: Record<string, number> = {};
    const byPriority: Record<MessagePriorityEnum, number> = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
    };

    let oldestMessageAt: number | undefined;
    let newestMessageAt: number | undefined;

    for (const msg of messages) {
      // 按会话统计
      byConversation[msg.conversationId] =
        (byConversation[msg.conversationId] ?? 0) + 1;

      // 按优先级统计
      byPriority[msg.priority] = (byPriority[msg.priority] ?? 0) + 1;

      // 统计时间范围
      if (!oldestMessageAt || msg.createdAt < oldestMessageAt) {
        oldestMessageAt = msg.createdAt;
      }
      if (!newestMessageAt || msg.createdAt > newestMessageAt) {
        newestMessageAt = msg.createdAt;
      }
    }

    return {
      total: messages.length,
      byConversation,
      byPriority,
      oldestMessageAt,
      newestMessageAt,
    };
  }

  /**
   * 清理过期消息
   * @param maxAge 最大保留时间（毫秒）
   * @returns 清理的消息数量
   */
  async cleanup(maxAge?: number): Promise<number> {
    const expiration = maxAge ?? this.config.messageExpiration;
    if (!expiration) {
      return 0;
    }

    const now = Date.now();
    const messages = await this.db.getAll<OfflineMessage>('offline_messages');
    const expiredMessages = messages.filter(
      (m) => now - m.createdAt > expiration,
    );

    for (const msg of expiredMessages) {
      await this.db.delete('offline_messages', msg.id);
    }

    // 更新内存中的消息
    this.currentMessages = this.currentMessages.filter(
      (m) => now - m.createdAt <= expiration,
    );

    if (expiredMessages.length > 0) {
      this.notifySubscribers();
    }

    return expiredMessages.length;
  }

  /**
   * 订阅队列变化
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribe(callback: (messages: OfflineMessage[]) => void): () => void {
    this.subscribers.add(callback);
    // 立即触发一次回调
    callback(this.currentMessages);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 通知所有订阅者
   */
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.currentMessages);
    }
  }

  /**
   * 启动定期清理任务
   */
  private startCleanupTask(): void {
    // 每小时清理一次过期消息
    this.cleanupTimer = setInterval(
      () => {
        this.cleanup().catch((error) => {
          console.error('[OfflineQueue] Cleanup failed:', error);
        });
      },
      60 * 60 * 1000,
    );
  }

  /**
   * 停止清理任务
   */
  private stopCleanupTask(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopCleanupTask();
    this.db.close();
    this.subscribers.clear();
    this.currentMessages = [];
  }

  /**
   * 计算下次重试时间
   * @param retryCount 当前重试次数
   * @returns 下次重试时间戳
   */
  calculateNextRetry(retryCount: number): number {
    const strategy = this.config.retryStrategy ?? 'exponential';
    const maxDelay = this.config.maxRetryDelay ?? 30000;

    let delay: number;

    switch (strategy) {
      case 'exponential':
        delay = Math.min(1000 * 2 ** retryCount, maxDelay);
        break;
      case 'linear': {
        const increment = this.config.linearRetryDelay ?? 2000;
        delay = Math.min(1000 + retryCount * increment, maxDelay);
        break;
      }
      case 'fixed':
        delay = this.config.fixedRetryDelay ?? 5000;
        break;
      default:
        delay = 5000;
    }

    return Date.now() + delay;
  }

  /**
   * 创建离线消息对象
   * @param message 原始消息数据
   * @param conversationId 会话 ID
   * @param sendParams 发送参数
   * @param priority 消息优先级
   * @returns 离线消息对象
   */
  createOfflineMessage(
    message: Omit<OfflineMessage['message'], 'id' | 'status'>,
    conversationId: string,
    sendParams: Record<string, unknown>,
    priority: MessagePriorityEnum = MessagePriorityEnum.Normal,
  ): OfflineMessage {
    return {
      id: generateUniqueId(),
      message,
      conversationId,
      sendParams,
      retryCount: 0,
      maxRetries: this.config.defaultMaxRetries ?? 3,
      createdAt: Date.now(),
      priority,
    };
  }
}
