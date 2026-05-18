import {
  MessageDirectionEnum,
  MessageStatusEnum,
  type MessageStatusUpdatedEvent,
} from '@/interfaces/message.interface';
import {
  type AckData,
  type MessageQueueAckResult,
  type MessageQueueCallback,
  type MessageQueueConfig,
  type MessageQueueEvent,
  MessageQueueEventType,
  type MessageQueueItem,
  MessageQueueStageEnum,
  type OutgoingMessageQueueItem,
  type ReceiptAckQueueItem,
  type RegisterMessageParams,
  type RegisterReceiptAckParams,
} from '@/interfaces/message-queue.interface';
import {
  AckMessageTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import {
  isServerMessageStatus,
  mapServerMessageStatusToLocal,
} from '@/services/protocol/status.mapper';

/**
 * 默认队列配置
 *
 * @description
 * 消息队列的默认配置值，当用户未提供自定义配置时使用
 */
const DEFAULT_CONFIG: Required<MessageQueueConfig> = {
  /**
   * 默认超时时间（毫秒）
   * - 60 秒后触发超时处理
   */
  defaultTimeout: 60000,
  /**
   * 默认最大重试次数
   * - 失败后最多重试 3 次
   */
  defaultMaxRetries: 3,
  /**
   * 超时检查间隔（毫秒）
   * - 每 1 秒检查一次超时项
   */
  timeoutCheckInterval: 1000,
  /**
   * 是否启用超时检查
   * - 默认启用自动超时检查
   */
  enableTimeoutCheck: true,
  /**
   * 孤立 ACK 最大存活时间（毫秒）
   * - 孤立 ACK 最多保留 30 秒等待匹配
   */
  orphanFoxAckMaxAge: 30000,
};

/**
 * 孤立状态确认条目
 *
 * @description
 * 存储无匹配队列项的状态确认信息，等待后续匹配
 */
type OrphanStatusAckEntry = {
  /**
   * 确认数据
   * - 原始的 ACK 数据
   */
  ackData: AckData;
  /**
   * 存储时间
   * - 存储孤立 ACK 的时间戳（毫秒）
   */
  storedAt: number;
};

/**
 * 回执确认类型集合
 *
 * @description
 * 用于识别回执确认消息的 ACK 类型
 */
const RECEIPT_ACK_TYPES = new Set<string>([
  AckMessageTypeEnum.MsgReceiveAck,
  AckMessageTypeEnum.MsgReadAck,
]);

/**
 * 外发消息状态优先级映射
 *
 * @description
 * 定义外发消息状态的优先级，用于判断是否应该保留现有状态
 * - 数值越大，优先级越高
 * - 高优先级状态会覆盖低优先级状态
 */
const OUTGOING_STATUS_PRIORITY: Record<MessageStatusEnum, number> = {
  [MessageStatusEnum.Created]: 0,
  [MessageStatusEnum.Queued]: 0,
  [MessageStatusEnum.Sending]: 1,
  [MessageStatusEnum.Failed]: 1,
  [MessageStatusEnum.Sent]: 2,
  [MessageStatusEnum.Delivered]: 3,
  [MessageStatusEnum.Read]: 4,
  [MessageStatusEnum.Revoked]: 5,
  [MessageStatusEnum.Deleted]: 5,
};

/**
 * 转换为服务端消息 ID
 *
 * @description
 * 将各种类型的值转换为标准的服务端消息 ID 字符串格式
 *
 * @param value - 待转换的值（字符串或数字）
 * @returns 转换后的服务端消息 ID，无效时返回 undefined
 */
function toServerMessageId(value: unknown): string | undefined {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

/**
 * 根据状态确定回执类型
 *
 * @description
 * 根据目标消息状态确定回执确认的类型
 *
 * @param status - 目标消息状态
 * @returns 回执类型（'read' 或 'receive'）
 */
function receiptAckKindFromStatus(
  status: ReceiptAckQueueItem['targetStatus'],
): ReceiptAckQueueItem['ackKind'] {
  return status === MessageStatusEnum.Read ? 'read' : 'receive';
}

/**
 * 判断是否为外发消息队列项
 *
 * @description
 * 类型守卫函数，判断队列项是否为外发消息
 *
 * @param item - 队列项
 * @returns 是否为外发消息队列项
 */
function isOutgoingItem(
  item: MessageQueueItem,
): item is OutgoingMessageQueueItem {
  return item.kind === MessageDirectionEnum.Outgoing;
}

/**
 * 判断是否为回执确认队列项
 *
 * @description
 * 类型守卫函数，判断队列项是否为回执确认
 *
 * @param item - 队列项
 * @returns 是否为回执确认队列项
 */
function isReceiptAckItem(item: MessageQueueItem): item is ReceiptAckQueueItem {
  return item.kind === 'receipt_ack';
}

/**
 * 判断是否应保留现有外发消息状态
 *
 * @description
 * 根据状态优先级判断是否应保留现有状态，避免低优先级状态覆盖高优先级状态
 *
 * @param current - 当前状态
 * @param next - 新状态
 * @returns 是否应保留现有状态
 */
function shouldKeepExistingOutgoingStatus(
  current: MessageStatusEnum | undefined,
  next: MessageStatusEnum,
): boolean {
  if (!current) {
    return false;
  }

  return OUTGOING_STATUS_PRIORITY[current] >= OUTGOING_STATUS_PRIORITY[next];
}

/**
 * 消息队列服务
 *
 * @description
 * 管理消息队列的核心服务，负责：
 * - 外发消息的发送追踪和状态确认
 * - 回执确认消息的管理和发送
 * - 超时检测和重试机制
 * - 孤立 ACK 的存储和重放
 *
 * 使用 Map 结构实现高效的查找和匹配：
 * - tempId → 外发消息项
 * - requestId → tempId 映射
 * - serverMessageId → tempId 映射
 * - ackRequestId → 回执确认项
 * - messageId → 孤立状态确认列表
 */
export class MessageQueueService {
  /**
   * 队列配置
   * - 合并默认配置和用户自定义配置
   */
  private readonly config: Required<MessageQueueConfig>;
  /**
   * 外发消息映射表（tempId → 队列项）
   * - 使用临时 ID 作为主键
   */
  private readonly outgoingByTempId = new Map<
    string,
    OutgoingMessageQueueItem
  >();
  /**
   * 请求 ID 映射表（requestId → tempId）
   * - 用于通过请求 ID 查找队列项
   */
  private readonly requestIdToTempId = new Map<string, string>();
  /**
   * 服务端消息 ID 映射表（serverMessageId → tempId）
   * - 用于通过服务端消息 ID 查找队列项
   */
  private readonly serverMessageIdToTempId = new Map<string, string>();
  /**
   * 回执确认映射表（ackRequestId → 队列项）
   * - 用于通过回执请求 ID 查找队列项
   */
  private readonly receiptByAckRequestId = new Map<
    string,
    ReceiptAckQueueItem
  >();
  /**
   * 孤立状态确认映射表（messageId → 确认条目列表）
   * - 存储无匹配队列项的状态确认
   */
  private readonly orphanStatusAcksByMessageId = new Map<
    string,
    OrphanStatusAckEntry[]
  >();
  /**
   * 事件订阅者集合
   * - 存储所有订阅队列事件的回调函数
   */
  private readonly subscribers = new Set<MessageQueueCallback>();
  /**
   * 超时检查定时器
   * - 用于定期检查超时的队列项
   */
  private timeoutChecker: ReturnType<typeof setInterval> | null = null;

  /**
   * 构造函数
   *
   * @description
   * 创建消息队列服务实例，合并配置并启动超时检查（如果启用）
   *
   * @param config - 可选的自定义配置
   */
  constructor(config?: MessageQueueConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (this.config.enableTimeoutCheck) {
      this.startTimeoutChecker();
    }
  }

  /**
   * 将外发消息加入队列
   *
   * @description
   * 创建新的外发消息队列项并加入队列管理
   * - 初始状态为 PendingSendAck
   * - 建立 tempId 和 requestId 的映射关系
   * - 触发 Enqueued 事件通知订阅者
   *
   * @param params - 注册消息参数
   * @returns 创建的队列项，参数无效时返回 undefined
   */
  enqueue(params: RegisterMessageParams): OutgoingMessageQueueItem | undefined {
    if (!params.tempId || !params.conversationId) {
      console.warn(
        '[MessageQueue] enqueue: tempId 和 conversationId 不能为空',
        params,
      );
      return undefined;
    }

    const now = Date.now();
    const timeout = params.timeout ?? this.config.defaultTimeout;
    const item: OutgoingMessageQueueItem = {
      kind: MessageDirectionEnum.Outgoing,
      requestId: params.requestId ?? params.tempId,
      tempId: params.tempId,
      conversationId: params.conversationId,
      channelType: params.channelType,
      direction: MessageDirectionEnum.Outgoing,
      stage: MessageQueueStageEnum.PendingSendAck,
      createdAt: now,
      updatedAt: now,
      timeoutAt: now + timeout,
      retryCount: 0,
      maxRetries: params.maxRetries ?? this.config.defaultMaxRetries,
      rawMessage: params.rawMessage,
    };

    this.outgoingByTempId.set(item.tempId, item);
    this.requestIdToTempId.set(item.requestId, item.tempId);

    this.notifySubscribers({
      type: MessageQueueEventType.Enqueued,
      item,
      timestamp: now,
    });

    return item;
  }

  /**
   * 将回执确认加入队列
   *
   * @description
   * 创建新的回执确认队列项并加入队列管理
   * - 初始状态为 PendingServerAck
   * - 根据目标状态自动推断回执类型（如未指定）
   * - 触发 Enqueued 事件通知订阅者
   *
   * @param params - 注册回执确认参数
   * @returns 创建的队列项，参数无效时返回 undefined
   */
  enqueueReceiptAck(
    params: RegisterReceiptAckParams,
  ): ReceiptAckQueueItem | undefined {
    if (
      !params.ackRequestId ||
      !params.conversationId ||
      !params.targetMessageId
    ) {
      console.warn(
        '[MessageQueue] registerReceiptAck: ackRequestId / conversationId / targetMessageId 不能为空',
        params,
      );
      return undefined;
    }

    const now = Date.now();
    const timeout = params.timeout ?? this.config.defaultTimeout;
    const item: ReceiptAckQueueItem = {
      kind: 'receipt_ack',
      ackKind: params.ackKind ?? receiptAckKindFromStatus(params.targetStatus),
      ackRequestId: params.ackRequestId,
      conversationId: params.conversationId,
      channelType: params.channelType,
      targetMessageId: params.targetMessageId,
      targetTempId: params.targetTempId,
      targetStatus: params.targetStatus,
      stage: MessageQueueStageEnum.PendingServerAck,
      createdAt: now,
      updatedAt: now,
      timeoutAt: now + timeout,
      retryCount: 0,
      maxRetries: params.maxRetries ?? this.config.defaultMaxRetries,
    };

    this.receiptByAckRequestId.set(item.ackRequestId, item);

    this.notifySubscribers({
      type: MessageQueueEventType.Enqueued,
      item,
      timestamp: now,
    });

    return item;
  }

  /**
   * 更新回执确认的请求 ID
   *
   * @description
   * 修改回执确认队列项的 ackRequestId，用于重试或重新发送场景
   * - 删除旧的映射关系
   * - 更新队列项的 ackRequestId
   * - 建立新的映射关系
   *
   * @param currentRequestId - 当前请求 ID
   * @param nextRequestId - 新请求 ID
   * @returns 是否成功更新
   */
  rekeyReceiptAck(currentRequestId: string, nextRequestId: string): boolean {
    if (
      !currentRequestId ||
      !nextRequestId ||
      currentRequestId === nextRequestId
    ) {
      return false;
    }

    const item = this.receiptByAckRequestId.get(currentRequestId);
    if (!item) {
      return false;
    }

    this.receiptByAckRequestId.delete(currentRequestId);
    item.ackRequestId = nextRequestId;
    item.updatedAt = Date.now();
    this.receiptByAckRequestId.set(nextRequestId, item);

    return true;
  }

  /**
   * 绑定服务端消息 ID
   *
   * @description
   * 为外发消息队列项绑定服务端返回的正式消息 ID
   * - 更新队列项的 serverMessageId 和 mid
   * - 建立新的映射关系
   * - 重放匹配的孤立状态确认
   *
   * @param identifier - 队列项标识符（tempId 或 requestId）
   * @param serverMessageId - 服务端消息 ID
   * @returns 重放的孤立状态确认事件列表
   */
  bindServerMessageId(
    identifier: string,
    serverMessageId: string,
  ): MessageStatusUpdatedEvent[] {
    const item = this.findOutgoing(identifier);
    if (!item) {
      return [];
    }

    const normalizedServerMessageId = toServerMessageId(serverMessageId);
    if (!normalizedServerMessageId) {
      return [];
    }

    if (item.serverMessageId === normalizedServerMessageId) {
      return [];
    }

    if (item.serverMessageId) {
      this.serverMessageIdToTempId.delete(item.serverMessageId);
    }

    item.serverMessageId = normalizedServerMessageId;
    // 尝试将 serverMessageId 转换为数值型的 mid（某些渠道返回数值型的消息 ID）
    const numericMid = Number(normalizedServerMessageId);
    item.mid = Number.isFinite(numericMid) ? numericMid : undefined;
    item.updatedAt = Date.now();
    this.serverMessageIdToTempId.set(normalizedServerMessageId, item.tempId);

    return this.replayOrphanStatusAcks(item, normalizedServerMessageId);
  }

  /**
   * 处理 ACK 消息
   *
   * @description
   * 根据 ACK 类型分发到相应的处理方法
   * - 外发消息 ACK → handleOutgoingAck
   * - 回执确认 ACK → handleReceiptAck
   * - 送达状态 ACK → handleDeliveryStatusAck
   *
   * @param ackData - ACK 数据
   * @returns 处理结果，包含是否已处理和状态更新事件
   */
  handleAck(ackData: AckData): MessageQueueAckResult {
    const ackType = ackData.body.type;

    if (
      ackData.ptype === PacketMessageTypeEnum.FoxMessageAck ||
      ackType === PacketMessageTypeEnum.FoxMessageAck
    ) {
      return this.handleDeliveryStatusAck(ackData);
    }

    if (
      ackType === PacketMessageTypeEnum.ChatMessage ||
      ackType === AckMessageTypeEnum.MsgSendFailed
    ) {
      return this.handleOutgoingAck(ackData);
    }

    if ('status' in ackData.body) {
      return this.handleDeliveryStatusAck(ackData);
    }

    if (RECEIPT_ACK_TYPES.has(ackType)) {
      return this.handleReceiptAck(ackData);
    }

    return { handled: false };
  }

  /**
   * 通过 ID 查找队列项
   *
   * @description
   * 使用任意标识符查找队列项（tempId、requestId 或 serverMessageId）
   *
   * @param id - 队列项标识符
   * @returns 找到的队列项，未找到时返回 undefined
   */
  findById(id: string): MessageQueueItem | undefined {
    return this.findOutgoing(id) ?? this.findReceiptAck(id);
  }

  /**
   * 通过临时 ID 查找外发消息队列项
   *
   * @description
   * 直接通过 tempId 查找外发消息队列项
   *
   * @param tempId - 临时 ID
   * @returns 找到的队列项，未找到时返回 undefined
   */
  findByTempId(tempId: string): OutgoingMessageQueueItem | undefined {
    return this.outgoingByTempId.get(tempId);
  }

  /**
   * 通过渠道消息 ID 查找外发消息队列项
   *
   * @description
   * 通过渠道返回的消息 ID 查找外发消息队列项
   *
   * @param mid - 渠道消息 ID（数字或字符串）
   * @returns 找到的队列项，未找到时返回 undefined
   */
  findByMid(mid: number | string): OutgoingMessageQueueItem | undefined {
    const serverMessageId = toServerMessageId(mid);
    if (!serverMessageId) {
      return undefined;
    }

    return this.findByServerMessageId(serverMessageId);
  }

  /**
   * 通过会话 ID 查找所有队列项
   *
   * @description
   * 查找指定会话的所有队列项（外发消息和回执确认）
   *
   * @param conversationId - 会话 ID
   * @returns 匹配的队列项列表
   */
  findByConversation(conversationId: string): MessageQueueItem[] {
    const items: MessageQueueItem[] = [];

    for (const item of this.outgoingByTempId.values()) {
      if (item.conversationId === conversationId) {
        items.push(item);
      }
    }

    for (const item of this.receiptByAckRequestId.values()) {
      if (item.conversationId === conversationId) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * 更新队列项阶段
   *
   * @description
   * 更新队列项的处理阶段，触发 StatusChanged 事件
   * - 仅在阶段实际变更时更新
   * - 自动更新 updatedAt 时间戳
   *
   * @param identifier - 队列项标识符
   * @param stage - 新的处理阶段
   */
  updateStage(identifier: string, stage: MessageQueueStageEnum): void {
    const item = this.findById(identifier);
    if (!item) {
      return;
    }

    const oldStage = item.stage;
    if (oldStage === stage) {
      return;
    }

    item.stage = stage as typeof item.stage;
    item.updatedAt = Date.now();

    this.notifySubscribers({
      type: MessageQueueEventType.StatusChanged,
      item,
      oldStage,
      newStage: stage,
      timestamp: item.updatedAt,
    });
  }

  /**
   * 获取所有超时的队列项
   *
   * @description
   * 查找所有已超时的队列项，根据不同类型有不同的超时条件：
   * - 外发消息：PendingSendAck 或 PendingChannelReceipt 阶段
   * - 回执确认：PendingServerAck 阶段
   *
   * @returns 超时的队列项列表
   */
  getTimedOutItems(): MessageQueueItem[] {
    const now = Date.now();
    const items: MessageQueueItem[] = [];

    for (const item of this.outgoingByTempId.values()) {
      if (
        item.timeoutAt <= now &&
        (item.stage === MessageQueueStageEnum.PendingSendAck ||
          item.stage === MessageQueueStageEnum.PendingChannelReceipt)
      ) {
        items.push(item);
      }
    }

    for (const item of this.receiptByAckRequestId.values()) {
      if (
        item.timeoutAt <= now &&
        item.stage === MessageQueueStageEnum.PendingServerAck
      ) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * 获取队列大小
   *
   * @description
   * 返回队列中所有队列项的总数
   *
   * @returns 队列项总数
   */
  size(): number {
    return this.outgoingByTempId.size + this.receiptByAckRequestId.size;
  }

  /**
   * 获取所有队列项
   *
   * @description
   * 返回队列中的所有队列项（外发消息和回执确认）
   *
   * @returns 所有队列项的数组
   */
  getAll(): MessageQueueItem[] {
    return [
      ...this.outgoingByTempId.values(),
      ...this.receiptByAckRequestId.values(),
    ];
  }

  /**
   * 检查队列项是否存在
   *
   * @description
   * 判断指定标识符的队列项是否存在于队列中
   *
   * @param identifier - 队列项标识符
   * @returns 队列项是否存在
   */
  has(identifier: string): boolean {
    return this.findById(identifier) !== undefined;
  }

  /**
   * 从队列中移除队列项
   *
   * @description
   * 将队列项从队列中移除并清理所有相关映射
   * - 外发消息：清理 tempId、requestId 和 serverMessageId 映射
   * - 回执确认：清理 ackRequestId 映射
   * - 触发 Dequeued 事件通知订阅者
   *
   * @param identifier - 队列项标识符
   * @returns 被移除的队列项，未找到时返回 undefined
   */
  dequeue(identifier: string): MessageQueueItem | undefined {
    const outgoingItem = this.findOutgoing(identifier);
    if (outgoingItem) {
      this.outgoingByTempId.delete(outgoingItem.tempId);
      this.requestIdToTempId.delete(outgoingItem.requestId);
      if (outgoingItem.serverMessageId) {
        this.serverMessageIdToTempId.delete(outgoingItem.serverMessageId);
      }

      this.notifySubscribers({
        type: MessageQueueEventType.Dequeued,
        item: outgoingItem,
        timestamp: Date.now(),
      });

      return outgoingItem;
    }

    const receiptItem = this.findReceiptAck(identifier);
    if (receiptItem) {
      this.receiptByAckRequestId.delete(receiptItem.ackRequestId);

      this.notifySubscribers({
        type: MessageQueueEventType.Dequeued,
        item: receiptItem,
        timestamp: Date.now(),
      });

      return receiptItem;
    }

    return undefined;
  }

  /**
   * 清空队列
   *
   * @description
   * 清空队列中的所有数据，包括：
   * - 外发消息映射
   * - 请求 ID 映射
   * - 服务端消息 ID 映射
   * - 回执确认映射
   * - 孤立状态确认映射
   */
  clear(): void {
    this.outgoingByTempId.clear();
    this.requestIdToTempId.clear();
    this.serverMessageIdToTempId.clear();
    this.receiptByAckRequestId.clear();
    this.orphanStatusAcksByMessageId.clear();
  }

  /**
   * 订阅队列事件
   *
   * @description
   * 注册回调函数以接收队列事件通知
   * - 返回取消订阅的函数
   *
   * @param callback - 事件回调函数
   * @returns 取消订阅的函数
   */
  subscribe(callback: MessageQueueCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 销毁队列服务
   *
   * @description
   * 清理队列服务的所有资源：
   * - 停止超时检查定时器
   * - 清除所有订阅者
   * - 清空队列数据
   */
  destroy(): void {
    this.stopTimeoutChecker();
    this.subscribers.clear();
    this.clear();
  }

  /**
   * 查找外发消息队列项
   *
   * @description
   * 通过任意标识符查找外发消息队列项
   * - 优先尝试 tempId
   * - 其次尝试 requestId 映射
   * - 最后尝试 serverMessageId 映射
   *
   * @param identifier - 队列项标识符
   * @returns 找到的队列项，未找到时返回 undefined
   */
  private findOutgoing(
    identifier: string,
  ): OutgoingMessageQueueItem | undefined {
    if (!identifier) {
      return undefined;
    }

    const tempId = this.outgoingByTempId.has(identifier)
      ? identifier
      : (this.requestIdToTempId.get(identifier) ??
        this.serverMessageIdToTempId.get(identifier));

    return tempId ? this.outgoingByTempId.get(tempId) : undefined;
  }

  /**
   * 查找回执确认队列项
   *
   * @description
   * 通过 ackRequestId 查找回执确认队列项
   *
   * @param identifier - 队列项标识符
   * @returns 找到的队列项，未找到时返回 undefined
   */
  private findReceiptAck(identifier: string): ReceiptAckQueueItem | undefined {
    return identifier ? this.receiptByAckRequestId.get(identifier) : undefined;
  }

  /**
   * 通过服务端消息 ID 查找外发消息队列项
   *
   * @description
   * 使用服务端消息 ID 查找对应的外发消息队列项
   *
   * @param serverMessageId - 服务端消息 ID
   * @returns 找到的队列项，未找到时返回 undefined
   */
  private findByServerMessageId(
    serverMessageId: string,
  ): OutgoingMessageQueueItem | undefined {
    const tempId = this.serverMessageIdToTempId.get(serverMessageId);
    return tempId ? this.outgoingByTempId.get(tempId) : undefined;
  }

  /**
   * 处理外发消息 ACK
   *
   * @description
   * 处理外发消息的发送确认
   * - MsgSendFailed → Failed 状态
   * - 其他 → Sent 状态并进入 PendingChannelReceipt 阶段
   * - 尝试绑定服务端消息 ID
   * - 失败时自动出队
   *
   * @param ackData - ACK 数据
   * @returns 处理结果
   */
  private handleOutgoingAck(ackData: AckData): MessageQueueAckResult {
    const item = this.findOutgoing(ackData.id);
    if (!item) {
      return { handled: false };
    }

    const nextStatus =
      ackData.body.type === AckMessageTypeEnum.MsgSendFailed
        ? MessageStatusEnum.Failed
        : MessageStatusEnum.Sent;
    const nextStage =
      nextStatus === MessageStatusEnum.Failed
        ? MessageQueueStageEnum.Failed
        : MessageQueueStageEnum.PendingChannelReceipt;

    const event = this.transitionOutgoingItem(
      item,
      nextStage,
      nextStatus,
      ackData,
    );

    const resolvedServerMessageId =
      toServerMessageId(ackData.body.mid) ?? toServerMessageId(ackData.mid);
    if (resolvedServerMessageId) {
      void this.bindServerMessageId(item.tempId, resolvedServerMessageId);
    }

    if (nextStage === MessageQueueStageEnum.Failed) {
      this.dequeue(item.tempId);
    }

    return { handled: true, statusEvent: event };
  }

  /**
   * 处理回执确认 ACK
   *
   * @description
   * 处理回执确认的发送确认
   * - 确认回执发送成功后出队
   * - 生成目标消息的状态更新事件
   *
   * @param ackData - ACK 数据
   * @returns 处理结果，包含目标消息的状态更新事件
   */
  private handleReceiptAck(ackData: AckData): MessageQueueAckResult {
    const item = this.findReceiptAck(ackData.id);
    if (!item) {
      return { handled: false };
    }

    const event: MessageStatusUpdatedEvent = {
      conversationId: item.conversationId,
      messageId: item.targetMessageId,
      tempId: item.targetTempId,
      channelType: item.channelType,
      status: item.targetStatus,
      timestamp: ackData.timestamp ?? Date.now(),
    };

    const oldStage = item.stage;
    item.stage = MessageQueueStageEnum.Completed;
    item.updatedAt = event.timestamp;

    this.notifySubscribers({
      type: MessageQueueEventType.StatusChanged,
      item,
      oldStage,
      newStage: item.stage,
      timestamp: item.updatedAt,
    });

    this.dequeue(item.ackRequestId);

    return { handled: true, statusEvent: event };
  }

  /**
   * 处理送达状态 ACK
   *
   * @description
   * 处理消息送达/已读等状态确认
   * - 尝试匹配目标消息队列项
   * - 匹配失败时存储为孤立 ACK
   * - 匹配成功时应用状态更新
   *
   * @param ackData - ACK 数据
   * @returns 处理结果
   */
  private handleDeliveryStatusAck(ackData: AckData): MessageQueueAckResult {
    const targetMessageId = this.resolveAckTargetMessageId(ackData);
    if (!targetMessageId) {
      return { handled: false };
    }

    const item = this.findOutgoing(targetMessageId);
    if (!item) {
      this.storeOrphanStatusAck(targetMessageId, ackData);
      return { handled: false };
    }

    return this.applyDeliveryStatus(item, ackData);
  }

  /**
   * 应用送达状态
   *
   * @description
   * 将 ACK 中的送达状态应用到外发消息队列项
   * - 检查状态优先级，避免降级
   * - 根据状态映射到相应的队列阶段
   * - 完成或失败时自动出队
   *
   * @param item - 外发消息队列项
   * @param ackData - ACK 数据
   * @returns 处理结果
   */
  private applyDeliveryStatus(
    item: OutgoingMessageQueueItem,
    ackData: AckData,
  ): MessageQueueAckResult {
    const nextStatus = this.resolveDeliveryStatus(ackData);
    if (!nextStatus) {
      return { handled: false };
    }

    if (shouldKeepExistingOutgoingStatus(item.rawMessage?.status, nextStatus)) {
      return { handled: true };
    }

    const nextStage =
      nextStatus === MessageStatusEnum.Sending ||
      nextStatus === MessageStatusEnum.Sent
        ? MessageQueueStageEnum.PendingChannelReceipt
        : nextStatus === MessageStatusEnum.Delivered
          ? MessageQueueStageEnum.Delivered
          : nextStatus === MessageStatusEnum.Read ||
              nextStatus === MessageStatusEnum.Revoked ||
              nextStatus === MessageStatusEnum.Deleted
            ? MessageQueueStageEnum.Completed
            : MessageQueueStageEnum.Failed;

    const event = this.transitionOutgoingItem(
      item,
      nextStage,
      nextStatus,
      ackData,
    );

    if (
      nextStage === MessageQueueStageEnum.Completed ||
      nextStage === MessageQueueStageEnum.Failed
    ) {
      this.dequeue(item.tempId);
    }

    return { handled: true, statusEvent: event };
  }

  /**
   * 转换外发消息队列项状态
   *
   * @description
   * 更新外发消息队列项的阶段和状态
   * - 更新原始消息对象的 status
   * - 触发 StatusChanged 事件
   * - 提取错误信息（如果有）
   * - 返回消息状态更新事件
   *
   * @param item - 外发消息队列项
   * @param nextStage - 下一阶段
   * @param nextStatus - 下一状态
   * @param ackData - 可选的 ACK 数据
   * @returns 消息状态更新事件
   */
  private transitionOutgoingItem(
    item: OutgoingMessageQueueItem,
    nextStage: OutgoingMessageQueueItem['stage'],
    nextStatus: MessageStatusEnum,
    ackData?: AckData,
  ): MessageStatusUpdatedEvent {
    const oldStage = item.stage;
    item.stage = nextStage;
    item.updatedAt = Date.now();
    if (item.rawMessage) {
      item.rawMessage.status = nextStatus;
    }

    this.notifySubscribers({
      type: MessageQueueEventType.StatusChanged,
      item,
      oldStage,
      newStage: nextStage,
      timestamp: item.updatedAt,
    });

    return {
      conversationId: item.conversationId,
      messageId: item.serverMessageId ?? item.requestId,
      tempId: item.tempId,
      channelType: item.channelType,
      status: nextStatus,
      ...(this.extractErrorInfo(ackData)
        ? { error: this.extractErrorInfo(ackData) }
        : {}),
      timestamp: item.updatedAt,
    };
  }

  /**
   * 解析送达状态
   *
   * @description
   * 从 ACK 数据中解析消息的送达状态
   * 支持多种 ACK 格式：
   * - 直接的 status 字段
   * - sendResult 字符串
   * - messageStatus 枚举值
   *
   * @param ackData - ACK 数据
   * @returns 解析到的消息状态，无法解析时返回 undefined
   */
  private resolveDeliveryStatus(
    ackData: AckData,
  ): MessageStatusEnum | undefined {
    if ('status' in ackData.body) {
      return isServerMessageStatus(ackData.body.status)
        ? mapServerMessageStatusToLocal(ackData.body.status)
        : undefined;
    }

    const sendResult = ackData.body.sendResult;
    if (typeof sendResult === 'string') {
      switch (sendResult) {
        case 'DELIVER_SUCCESS':
          return MessageStatusEnum.Delivered;
        case 'REPLIED':
        case 'RECEIVER_OPENED':
          return MessageStatusEnum.Read;
        case 'SUBMIT_FAIL':
        case 'DELIVER_FAIL':
          return MessageStatusEnum.Failed;
        default:
          return undefined;
      }
    }

    return undefined;
  }

  /**
   * 解析 ACK 目标消息 ID
   *
   * @description
   * 从 ACK 数据中提取目标消息的 ID
   * 支持多种可能的字段位置：
   * - ackData.body.id
   * - ackData.body.mid
   * - ackData.mid
   * - ackData.id
   *
   * @param ackData - ACK 数据
   * @returns 目标消息 ID，无法提取时返回 undefined
   */
  private resolveAckTargetMessageId(ackData: AckData): string | undefined {
    return (
      toServerMessageId(ackData.body.id) ??
      toServerMessageId(ackData.body.mid) ??
      toServerMessageId(ackData.mid) ??
      toServerMessageId(ackData.id)
    );
  }

  /**
   * 提取错误信息
   *
   * @description
   * 从 ACK 数据中提取错误信息（如果有）
   *
   * @param ackData - ACK 数据
   * @returns 错误信息，不存在时返回 undefined
   */
  private extractErrorInfo(ackData?: AckData): string | undefined {
    if (!ackData || typeof ackData.body.errorInfo !== 'string') {
      return undefined;
    }

    return ackData.body.errorInfo || undefined;
  }

  /**
   * 重放孤立状态确认
   *
   * @description
   * 当外发消息绑定服务端消息 ID 后，重放之前收到的孤立状态确认
   * - 查找所有匹配的孤立 ACK
   * - 逐个应用状态更新
   * - 触发 OrphanReplayed 事件通知订阅者
   *
   * @param item - 外发消息队列项
   * @param messageId - 消息 ID
   * @returns 重放的状态更新事件列表
   */
  private replayOrphanStatusAcks(
    item: OutgoingMessageQueueItem,
    messageId: string,
  ): MessageStatusUpdatedEvent[] {
    const orphanEntries = this.orphanStatusAcksByMessageId.get(messageId);
    if (!orphanEntries || orphanEntries.length === 0) {
      return [];
    }

    this.orphanStatusAcksByMessageId.delete(messageId);

    const events: MessageStatusUpdatedEvent[] = [];
    for (const orphanEntry of orphanEntries) {
      const result = this.applyDeliveryStatus(item, orphanEntry.ackData);
      if (result.statusEvent) {
        events.push(result.statusEvent);
      }

      this.notifySubscribers({
        type: MessageQueueEventType.OrphanReplayed,
        item,
        timestamp: Date.now(),
      });
    }

    return events;
  }

  /**
   * 存储孤立状态确认
   *
   * @description
   * 将无法匹配队列项的状态确认为孤立 ACK 存储
   * - 记录存储时间以便后续清理
   * - 等待匹配的消息队列项出现后重放
   *
   * @param messageId - 消息 ID
   * @param ackData - ACK 数据
   */
  private storeOrphanStatusAck(messageId: string, ackData: AckData): void {
    const entries = this.orphanStatusAcksByMessageId.get(messageId) ?? [];
    entries.push({
      ackData,
      storedAt: Date.now(),
    });
    this.orphanStatusAcksByMessageId.set(messageId, entries);
  }

  /**
   * 启动超时检查定时器
   *
   * @description
   * 启动定期检查超时的定时器
   * - 避免重复启动
   * - 按配置的间隔执行检查
   */
  private startTimeoutChecker(): void {
    if (this.timeoutChecker) {
      return;
    }

    this.timeoutChecker = setInterval(() => {
      this.cleanupExpiredOrphanStatusAcks();
      this.handleTimeouts();
    }, this.config.timeoutCheckInterval);
  }

  /**
   * 停止超时检查定时器
   *
   * @description
   * 停止超时检查定时器并清理资源
   */
  private stopTimeoutChecker(): void {
    if (this.timeoutChecker) {
      clearInterval(this.timeoutChecker);
      this.timeoutChecker = null;
    }
  }

  /**
   * 清理过期的孤立状态确认
   *
   * @description
   * 定期清理超过最大存活时间的孤立 ACK
   * - 移除过期的条目
   * - 清理空列表的 messageId 键
   */
  private cleanupExpiredOrphanStatusAcks(): void {
    const now = Date.now();

    for (const [messageId, entries] of this.orphanStatusAcksByMessageId) {
      const nextEntries = entries.filter(
        (entry) => now - entry.storedAt <= this.config.orphanFoxAckMaxAge,
      );

      if (nextEntries.length === 0) {
        this.orphanStatusAcksByMessageId.delete(messageId);
      } else {
        this.orphanStatusAcksByMessageId.set(messageId, nextEntries);
      }
    }
  }

  /**
   * 处理超时的队列项
   *
   * @description
   * 处理所有已超时的队列项
   * - 将阶段更新为 TimedOut
   * - 触发 Timeout 事件通知订阅者
   * - 自动出队超时的队列项
   */
  private handleTimeouts(): void {
    for (const item of this.getTimedOutItems()) {
      const oldStage = item.stage;
      item.stage = MessageQueueStageEnum.TimedOut as typeof item.stage;
      item.updatedAt = Date.now();

      this.notifySubscribers({
        type: MessageQueueEventType.Timeout,
        item,
        oldStage,
        newStage: item.stage,
        timestamp: item.updatedAt,
      });

      if (isOutgoingItem(item)) {
        this.dequeue(item.tempId);
      } else if (isReceiptAckItem(item)) {
        this.dequeue(item.ackRequestId);
      }
    }
  }

  /**
   * 通知订阅者
   *
   * @description
   * 向所有订阅者发送队列事件
   * - 捕获并记录回调执行错误
   * - 确保单个回调失败不影响其他回调
   *
   * @param event - 队列事件
   */
  private notifySubscribers(event: MessageQueueEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error('[MessageQueue] 订阅者回调执行失败', error);
      }
    }
  }
}

/**
 * 消息队列服务单例
 *
 * @description
 * 全局共享的消息队列服务实例
 * - 使用默认配置初始化
 * - 可在整个应用中直接使用
 */
export const messageQueue = new MessageQueueService();
