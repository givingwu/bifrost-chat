import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageStatusUpdatedEvent,
  StandardMessage,
} from '@/interfaces/message.interface';

/**
 * 消息队列阶段
 *
 * @description
 * 仅描述队列内部生命周期，不直接等同于 UI 消息状态。
 */
export enum MessageQueueStageEnum {
  PendingSendAck = 'pending_send_ack',
  PendingServerAck = 'pending_server_ack',
  PendingChannelReceipt = 'pending_channel_receipt',
  Delivered = 'delivered',
  Completed = 'completed',
  Failed = 'failed',
  TimedOut = 'timed_out',
}

interface BaseMessageQueueItem {
  conversationId: string;
  channelType?: ChannelTypeEnum;
  createdAt: number;
  updatedAt: number;
  timeoutAt: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

export interface OutgoingMessageQueueItem extends BaseMessageQueueItem {
  kind: 'outgoing';
  requestId: string;
  tempId: string;
  serverMessageId?: string;
  mid?: number;
  direction: MessageDirectionEnum.Outgoing;
  stage:
  | MessageQueueStageEnum.PendingSendAck
  | MessageQueueStageEnum.PendingChannelReceipt
  | MessageQueueStageEnum.Delivered
  | MessageQueueStageEnum.Completed
  | MessageQueueStageEnum.Failed
  | MessageQueueStageEnum.TimedOut;
  rawMessage?: StandardMessage;
}

export interface ReceiptAckQueueItem extends BaseMessageQueueItem {
  kind: 'receipt_ack';
  ackKind: 'receive' | 'read';
  ackRequestId: string;
  targetMessageId: string;
  targetTempId?: string;
  targetStatus: MessageStatusEnum.Delivered | MessageStatusEnum.Read;
  stage:
  | MessageQueueStageEnum.PendingServerAck
  | MessageQueueStageEnum.Completed
  | MessageQueueStageEnum.Failed
  | MessageQueueStageEnum.TimedOut;
}

export type MessageQueueItem = OutgoingMessageQueueItem | ReceiptAckQueueItem;

export interface RegisterMessageParams {
  requestId?: string;
  tempId: string;
  conversationId: string;
  channelType?: ChannelTypeEnum;
  direction?: MessageDirectionEnum;
  timeout?: number;
  maxRetries?: number;
  rawMessage?: StandardMessage;
}

export interface RegisterReceiptAckParams {
  ackRequestId: string;
  conversationId: string;
  targetMessageId: string;
  targetTempId?: string;
  channelType?: ChannelTypeEnum;
  targetStatus: MessageStatusEnum.Delivered | MessageStatusEnum.Read;
  ackKind?: 'receive' | 'read';
  timeout?: number;
  maxRetries?: number;
}

/**
 * 队列内部使用的 ACK 结构
 */
export interface AckData {
  id: string;
  ptype: string;
  mid?: string | number;
  chatId?: string | null;
  channelType?: ChannelTypeEnum;
  body: {
    type: string;
    mid?: string | number;
    [key: string]: unknown;
  };
  timestamp?: number;
}

export interface MessageQueueConfig {
  defaultTimeout?: number;
  defaultMaxRetries?: number;
  timeoutCheckInterval?: number;
  enableTimeoutCheck?: boolean;
  orphanFoxAckMaxAge?: number;
}

export enum MessageQueueEventType {
  Enqueued = 'enqueued',
  StatusChanged = 'status_changed',
  Dequeued = 'dequeued',
  Timeout = 'timeout',
  Retry = 'retry',
  OrphanStored = 'orphan_stored',
  OrphanReplayed = 'orphan_replayed',
}

export interface MessageQueueEvent {
  type: MessageQueueEventType;
  item: MessageQueueItem;
  oldStage?: MessageQueueStageEnum;
  newStage?: MessageQueueStageEnum;
  timestamp: number;
}

export type MessageQueueCallback = (event: MessageQueueEvent) => void;

export interface MessageQueueAckResult {
  handled: boolean;
  statusEvent?: MessageStatusUpdatedEvent;
}
