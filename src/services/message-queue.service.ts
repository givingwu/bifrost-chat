import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageStatusUpdatedEvent,
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

const DEFAULT_CONFIG: Required<MessageQueueConfig> = {
  defaultTimeout: 10000,
  defaultMaxRetries: 3,
  timeoutCheckInterval: 1000,
  enableTimeoutCheck: true,
  orphanFoxAckMaxAge: 30000,
};

type OrphanStatusAckEntry = {
  ackData: AckData;
  storedAt: number;
};

const RECEIPT_ACK_TYPES = new Set<string>([
  AckMessageTypeEnum.MsgReceiveAck,
  AckMessageTypeEnum.MsgReadAck,
]);

const OUTGOING_STATUS_PRIORITY: Record<MessageStatusEnum, number> = {
  [MessageStatusEnum.Created]: 0,
  [MessageStatusEnum.Queued]: 0,
  [MessageStatusEnum.Sending]: 1,
  [MessageStatusEnum.Sent]: 2,
  [MessageStatusEnum.Delivered]: 3,
  [MessageStatusEnum.Read]: 4,
  [MessageStatusEnum.Failed]: 1,
  [MessageStatusEnum.Revoked]: 5,
  [MessageStatusEnum.Deleted]: 5,
};

function toServerMessageId(value: unknown): string | undefined {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function toNumericMid(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function receiptAckKindFromStatus(
  status: ReceiptAckQueueItem['targetStatus'],
): ReceiptAckQueueItem['ackKind'] {
  return status === MessageStatusEnum.Read ? 'read' : 'receive';
}

function isOutgoingItem(
  item: MessageQueueItem,
): item is OutgoingMessageQueueItem {
  return item.kind === 'outgoing';
}

function isReceiptAckItem(item: MessageQueueItem): item is ReceiptAckQueueItem {
  return item.kind === 'receipt_ack';
}

function shouldKeepExistingOutgoingStatus(
  current: MessageStatusEnum | undefined,
  next: MessageStatusEnum,
): boolean {
  if (!current) {
    return false;
  }

  return OUTGOING_STATUS_PRIORITY[current] >= OUTGOING_STATUS_PRIORITY[next];
}

export class MessageQueueService {
  private readonly config: Required<MessageQueueConfig>;
  private readonly outgoingByTempId = new Map<
    string,
    OutgoingMessageQueueItem
  >();
  private readonly requestIdToTempId = new Map<string, string>();
  private readonly serverMessageIdToTempId = new Map<string, string>();
  private readonly receiptByAckRequestId = new Map<
    string,
    ReceiptAckQueueItem
  >();
  private readonly orphanStatusAcksByMessageId = new Map<
    string,
    OrphanStatusAckEntry[]
  >();
  private readonly subscribers = new Set<MessageQueueCallback>();
  private timeoutChecker: ReturnType<typeof setInterval> | null = null;

  constructor(config?: MessageQueueConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    if (this.config.enableTimeoutCheck) {
      this.startTimeoutChecker();
    }
  }

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
      kind: 'outgoing',
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
    item.mid = toNumericMid(normalizedServerMessageId);
    item.updatedAt = Date.now();
    this.serverMessageIdToTempId.set(normalizedServerMessageId, item.tempId);

    return this.replayOrphanStatusAcks(item, normalizedServerMessageId);
  }

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

  findById(id: string): MessageQueueItem | undefined {
    return this.findOutgoing(id) ?? this.findReceiptAck(id);
  }

  findByTempId(tempId: string): OutgoingMessageQueueItem | undefined {
    return this.outgoingByTempId.get(tempId);
  }

  findByMid(mid: number | string): OutgoingMessageQueueItem | undefined {
    const serverMessageId = toServerMessageId(mid);
    if (!serverMessageId) {
      return undefined;
    }

    return this.findByServerMessageId(serverMessageId);
  }

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

  size(): number {
    return this.outgoingByTempId.size + this.receiptByAckRequestId.size;
  }

  getAll(): MessageQueueItem[] {
    return [
      ...this.outgoingByTempId.values(),
      ...this.receiptByAckRequestId.values(),
    ];
  }

  has(identifier: string): boolean {
    return this.findById(identifier) !== undefined;
  }

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

  clear(): void {
    this.outgoingByTempId.clear();
    this.requestIdToTempId.clear();
    this.serverMessageIdToTempId.clear();
    this.receiptByAckRequestId.clear();
    this.orphanStatusAcksByMessageId.clear();
  }

  subscribe(callback: MessageQueueCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy(): void {
    this.stopTimeoutChecker();
    this.subscribers.clear();
    this.clear();
  }

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

  private findReceiptAck(identifier: string): ReceiptAckQueueItem | undefined {
    return identifier ? this.receiptByAckRequestId.get(identifier) : undefined;
  }

  private findByServerMessageId(
    serverMessageId: string,
  ): OutgoingMessageQueueItem | undefined {
    const tempId = this.serverMessageIdToTempId.get(serverMessageId);
    return tempId ? this.outgoingByTempId.get(tempId) : undefined;
  }

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

    const messageStatus = toNumericMid(ackData.body.messageStatus);
    switch (messageStatus) {
      case 5:
        return MessageStatusEnum.Delivered;
      case 6:
      case 7:
        return MessageStatusEnum.Read;
      case 4:
        return MessageStatusEnum.Failed;
      default:
        return undefined;
    }
  }

  private resolveAckTargetMessageId(ackData: AckData): string | undefined {
    return (
      toServerMessageId(ackData.body.id) ??
      toServerMessageId(ackData.body.mid) ??
      toServerMessageId(ackData.mid) ??
      toServerMessageId(ackData.id)
    );
  }

  private extractErrorInfo(ackData?: AckData): string | undefined {
    if (!ackData || typeof ackData.body.errorInfo !== 'string') {
      return undefined;
    }

    return ackData.body.errorInfo || undefined;
  }

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

  private storeOrphanStatusAck(messageId: string, ackData: AckData): void {
    const entries = this.orphanStatusAcksByMessageId.get(messageId) ?? [];
    entries.push({
      ackData,
      storedAt: Date.now(),
    });
    this.orphanStatusAcksByMessageId.set(messageId, entries);
  }

  private startTimeoutChecker(): void {
    if (this.timeoutChecker) {
      return;
    }

    this.timeoutChecker = setInterval(() => {
      this.cleanupExpiredOrphanStatusAcks();
      this.handleTimeouts();
    }, this.config.timeoutCheckInterval);
  }

  private stopTimeoutChecker(): void {
    if (this.timeoutChecker) {
      clearInterval(this.timeoutChecker);
      this.timeoutChecker = null;
    }
  }

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

export const messageQueue = new MessageQueueService();
