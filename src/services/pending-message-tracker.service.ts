/**
 * 待处理消息追踪器
 *
 * @description
 * 维护 messageId → conversationId 的映射关系。
 * 用于在服务端 ACK 中缺少 chatId 时，通过 messageId 查找对应的 conversationId。
 *
 * @module services/pending-message-tracker
 *
 * @example
 * ```typescript
 * // 发送消息成功后注册映射
 * pendingMessageTracker.register('msg-123', 'conv-456');
 *
 * // 收到 ACK 时查询映射
 * const conversationId = pendingMessageTracker.get('msg-123');
 * // conversationId === 'conv-456'
 *
 * // 处理完成后移除映射
 * pendingMessageTracker.remove('msg-123');
 * ```
 */

/**
 * 映射条目
 */
interface MappingEntry {
  /** 会话 ID */
  conversationId: string;
  /** 注册时间戳 */
  registeredAt: number;
}

/**
 * PendingMessageTracker 配置
 */
export interface PendingMessageTrackerConfig {
  /** 映射最大存活时间（毫秒），默认 5 分钟 */
  maxAge?: number;
  /** 是否启用定期清理，默认 true */
  enableCleanup?: boolean;
  /** 清理间隔（毫秒），默认 1 分钟 */
  cleanupInterval?: number;
}

/**默认配置 */
const DEFAULT_CONFIG: Required<PendingMessageTrackerConfig> = {
  maxAge: 5 * 60 * 1000, // 5 分钟
  enableCleanup: true,
  cleanupInterval: 60 * 1000, // 1 分钟
};

/**
 * 待处理消息追踪器
 *
 * @description
 * 维护 messageId → conversationId 的映射关系，
 * 用于在 ACK 中缺少 chatId 时查找对应的会话。
 *
 * 特性：
 * - 支持过期清理，避免内存泄漏
 * - 线程安全（基于 Map 的原子操作）
 * - 支持批量操作
 */
export class PendingMessageTracker {
  /** 映射表 */
  private readonly mappings: Map<string, MappingEntry> = new Map();

  /** 配置 */
  private readonly config: Required<PendingMessageTrackerConfig>;

  /** 清理定时器 */
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: PendingMessageTrackerConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (this.config.enableCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * 注册消息映射
   *
   * @param messageId 消息 ID
   * @param conversationId 会话 ID
   */
  register(messageId: string, conversationId: string): void {
    if (!messageId || !conversationId) {
      console.warn(
        '[PendingMessageTracker] register: messageId 和 conversationId 不能为空',
        { messageId, conversationId },
      );
      return;
    }

    this.mappings.set(messageId, {
      conversationId,
      registeredAt: Date.now(),
    });
  }

  /**
   * 获取消息对应的会话 ID
   *
   * @param messageId 消息 ID
   * @returns 会话 ID，如果不存在或已过期则返回 undefined
   */
  get(messageId: string): string | undefined {
    const entry = this.mappings.get(messageId);

    if (!entry) {
      return undefined;
    }

    // 检查是否过期
    if (this.isExpired(entry.registeredAt)) {
      this.mappings.delete(messageId);
      return undefined;
    }

    return entry.conversationId;
  }

  /**
   * 移除消息映射
   *
   * @param messageId 消息 ID
   * @returns 是否成功移除
   */
  remove(messageId: string): boolean {
    return this.mappings.delete(messageId);
  }

  /**
   * 检查映射是否存在
   *
   * @param messageId 消息 ID
   * @returns 是否存在有效的映射
   */
  has(messageId: string): boolean {
    return this.get(messageId) !== undefined;
  }

  /**
   * 获取当前映射数量
   *
   * @returns 映射数量
   */
  size(): number {
    return this.mappings.size;
  }

  /**
   * 批量清理过期的映射
   *
   * @returns 清理的映射数量
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [messageId, entry] of this.mappings) {
      if (this.isExpired(entry.registeredAt, now)) {
        this.mappings.delete(messageId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.info(`[PendingMessageTracker] 清理了 ${cleanedCount} 个过期映射`);
    }

    return cleanedCount;
  }

  /**
   * 清空所有映射
   */
  clear(): void {
    this.mappings.clear();
  }

  /**
   * 销毁追踪器，停止定时清理
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }

  /**
   * 获取所有映射（用于调试）
   *
   * @returns 映射表的快照
   */
  getAll(): ReadonlyMap<string, MappingEntry> {
    return new Map(this.mappings);
  }

  // ==================== 私有方法 ====================

  /**
   * 检查条目是否过期
   */
  private isExpired(registeredAt: number, now = Date.now()): boolean {
    return now - registeredAt > this.config.maxAge;
  }

  /**
   * 启动定期清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止定期清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * 全局单例实例
 *
 * @description
 * 提供全局访问点，便于在没有依赖注入的场景下使用。
 * 如果使用 ServiceProvider 注入，可以创建新实例。
 */
export const pendingMessageTracker = new PendingMessageTracker();
