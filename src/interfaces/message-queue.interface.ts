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
  /**
   * 等待发送 ACK
   * - 发送方已将消息发送到渠道
   * - 等待渠道返回发送确认（如 WA 的 Sent 状态）
   */
  PendingSendAck = 'pending_send_ack',
  /**
   * 等待服务端 ACK
   * - 已收到渠道发送确认
   * - 等待服务端返回消息已接收确认
   */
  PendingServerAck = 'pending_server_ack',
  /**
   * 等待渠道回执
   * - 服务端已确认接收消息
   * - 等待渠道返回送达/已读回执
   */
  PendingChannelReceipt = 'pending_channel_receipt',
  /**
   * 已送达
   * - 已收到渠道的送达确认
   * - 消息已成功投递到接收方
   */
  Delivered = 'delivered',
  /**
   * 已完成
   * - 所有处理流程已完成
   * - 可以安全地从队列中移除
   */
  Completed = 'completed',
  /**
   * 失败
   * - 处理过程中发生错误
   * - 已达到最大重试次数或不可恢复的错误
   */
  Failed = 'failed',
  /**
   * 超时
   * - 在指定时间内未收到预期的确认
   * - 消息可能已丢失或处理延迟
   */
  TimedOut = 'timed_out',
}

/**
 * 队列项基类
 *
 * @description
 * 所有队列项的公共属性，用于追踪消息处理状态、重试逻辑和生命周期。
 */
interface BaseMessageQueueItem {
  /**
   * 会话 ID
   * - 关联的会话标识符
   */
  conversationId: string;
  /**
   * 渠道类型
   * - 可选，用于区分不同消息渠道（如 WhatsApp、短信等）
   */
  channelType?: ChannelTypeEnum;
  /**
   * 创建时间
   * - 消息首次加入队列的时间戳（毫秒）
   */
  createdAt: number;
  /**
   * 更新时间
   * - 最后一次状态变更的时间戳（毫秒）
   */
  updatedAt: number;
  /**
   * 超时时间
   * - 预期完成处理的时间戳（毫秒）
   * - 超过此时间将触发超时处理逻辑
   */
  timeoutAt: number;
  /**
   * 当前重试次数
   * - 已执行的重试次数
   * - 达到 maxRetries 后不再重试
   */
  retryCount: number;
  /**
   * 最大重试次数
   * - 允许的最大重试次数
   * - 超过此次数将转为 Failed 状态
   */
  maxRetries: number;
  /**
   * 最后错误信息
   * - 可选，最后一次失败的错误描述
   * - 用于调试和日志记录
   */
  lastError?: string;
}

/**
 * 外发消息队列项
 *
 * @description
 * 用于追踪待发送的外发消息的生命周期，从发送到最终确认或失败。
 */
export interface OutgoingMessageQueueItem extends BaseMessageQueueItem {
  /**
   * 队列项类型标识
   * - 固定值为 'outgoing'，用于类型区分
   */
  kind: MessageDirectionEnum.Outgoing;
  /**
   * 请求 ID
   * - 唯一标识此消息发送请求
   * - 用于匹配服务端响应和 ACK
   */
  requestId: string;
  /**
   * 临时 ID
   * - 客户端生成的临时消息标识符
   * - 在服务端消息 ID 到达前用于 UI 显示
   */
  tempId: string;
  /**
   * 服务端消息 ID
   * - 可选，服务端返回的正式消息 ID
   * - 替换 tempId 用于最终存储和关联
   */
  serverMessageId?: string;
  /**
   * 消息 ID
   * - 可选，渠道返回的消息 ID（如 WA 的 mid）
   */
  mid?: number;
  /**
   * 消息方向
   * - 固定为 Outgoing，标识此为外发消息
   */
  direction: MessageDirectionEnum.Outgoing;
  /**
   * 当前处理阶段
   * - 描述消息在队列中的当前生命周期阶段
   * - 不等同于 UI 显示的消息状态
   */
  stage:
    | MessageQueueStageEnum.PendingSendAck
    | MessageQueueStageEnum.PendingChannelReceipt
    | MessageQueueStageEnum.Delivered
    | MessageQueueStageEnum.Completed
    | MessageQueueStageEnum.Failed
    | MessageQueueStageEnum.TimedOut;
  /**
   * 原始消息数据
   * - 可选，完整的消息对象
   * - 用于消息重放或调试
   */
  rawMessage?: StandardMessage;
}

/**
 * 回执确认队列项
 *
 * @description
 * 用于追踪回执确认消息（送达/已读）的发送生命周期，确保确认消息成功发送到服务端。
 */
export interface ReceiptAckQueueItem extends BaseMessageQueueItem {
  /**
   * 队列项类型标识
   * - 固定值为 'receipt_ack'，用于类型区分
   */
  kind: 'receipt_ack';
  /**
   * 回执类型
   * - 'receive': 送达回执
   * - 'read': 已读回执
   */
  ackKind: 'receive' | 'read';
  /**
   * 回执请求 ID
   * - 唯一标识此回执发送请求
   * - 用于匹配服务端响应和确认
   */
  ackRequestId: string;
  /**
   * 目标消息 ID
   * - 需要确认的目标消息的服务端 ID
   * - 用于服务端匹配和状态更新
   */
  targetMessageId: string;
  /**
   * 目标消息临时 ID
   * - 可选，目标消息的客户端临时 ID
   * - 用于在服务端消息 ID 到达前进行匹配
   */
  targetTempId?: string;
  /**
   * 目标状态
   * - 确认后目标消息应处于的状态
   * - Delivered 或 Read
   */
  targetStatus: MessageStatusEnum.Delivered | MessageStatusEnum.Read;
  /**
   * 当前处理阶段
   * - 描述回执在队列中的当前生命周期阶段
   */
  stage:
    | MessageQueueStageEnum.PendingServerAck
    | MessageQueueStageEnum.Completed
    | MessageQueueStageEnum.Failed
    | MessageQueueStageEnum.TimedOut;
}

/**
 * 消息队列项类型联合
 *
 * @description
 * 支持的队列项类型：外发消息或回执确认
 */
export type MessageQueueItem = OutgoingMessageQueueItem | ReceiptAckQueueItem;

/**
 * 注册消息参数
 *
 * @description
 * 将新消息加入队列时提供的参数配置
 */
export interface RegisterMessageParams {
  /**
   * 请求 ID
   * - 可选，如果不提供将自动生成
   * - 唯一标识此消息发送请求
   */
  requestId?: string;
  /**
   * 临时 ID
   * - 必选，客户端生成的临时消息标识符
   * - 在服务端消息 ID 到达前用于 UI 显示
   */
  tempId: string;
  /**
   * 会话 ID
   * - 必选，关联的会话标识符
   */
  conversationId: string;
  /**
   * 渠道类型
   * - 可选，用于区分不同消息渠道
   */
  channelType?: ChannelTypeEnum;
  /**
   * 消息方向
   * - 可选，默认为 Outgoing
   */
  direction?: MessageDirectionEnum;
  /**
   * 超时时间（毫秒）
   * - 可选，如果不提供则使用默认配置
   * - 超过此时间将触发超时处理逻辑
   */
  timeout?: number;
  /**
   * 最大重试次数
   * - 可选，如果不提供则使用默认配置
   * - 超过此次数将转为 Failed 状态
   */
  maxRetries?: number;
  /**
   * 原始消息数据
   * - 可选，完整的消息对象
   * - 用于消息重放或调试
   */
  rawMessage?: StandardMessage;
}

/**
 * 注册回执确认参数
 *
 * @description
 * 将回执确认加入队列时提供的参数配置
 */
export interface RegisterReceiptAckParams {
  /**
   * 回执请求 ID
   * - 必选，唯一标识此回执发送请求
   */
  ackRequestId: string;
  /**
   * 会话 ID
   * - 必选，关联的会话标识符
   */
  conversationId: string;
  /**
   * 目标消息 ID
   * - 必选，需要确认的目标消息的服务端 ID
   */
  targetMessageId: string;
  /**
   * 目标消息临时 ID
   * - 可选，目标消息的客户端临时 ID
   */
  targetTempId?: string;
  /**
   * 渠道类型
   * - 可选，用于区分不同消息渠道
   */
  channelType?: ChannelTypeEnum;
  /**
   * 目标状态
   * - 必选，确认后目标消息应处于的状态
   */
  targetStatus: MessageStatusEnum.Delivered | MessageStatusEnum.Read;
  /**
   * 回执类型
   * - 可选，默认为 'read'
   * - 'receive': 送达回执
   * - 'read': 已读回执
   */
  ackKind?: 'receive' | 'read';
  /**
   * 超时时间（毫秒）
   * - 可选，如果不提供则使用默认配置
   */
  timeout?: number;
  /**
   * 最大重试次数
   * - 可选，如果不提供则使用默认配置
   */
  maxRetries?: number;
}

/**
 * 队列内部使用的 ACK 结构
 */
/**
 * 队列内部使用的 ACK 结构
 *
 * @description
 * 用于队列内部处理的确认消息结构，包含渠道返回的原始确认信息
 */
export interface AckData {
  /**
   * 确认 ID
   * - 确认消息的唯一标识符
   */
  id: string;
  /**
   * 数据包类型
   * - 确认消息的类型标识
   */
  ptype: string;
  /**
   * 消息 ID
   * - 可选，渠道返回的消息 ID（如 WA 的 mid）
   */
  mid?: string | number;
  /**
   * 聊天 ID
   * - 可选，关联的会话 ID
   * - 可能为 null
   */
  chatId?: string | null;
  /**
   * 渠道类型
   * - 可选，发送确认的渠道类型
   */
  channelType?: ChannelTypeEnum;
  /**
   * 确认消息体
   * - 包含确认的详细信息和相关消息 ID
   */
  body: {
    /**
     * 确认类型
     * - 确认消息的类型标识
     */
    type: string;
    /**
     * 消息 ID
     * - 可选，确认关联的消息 ID
     */
    mid?: string | number;
    /**
     * 其他属性
     * - 可能包含的其他确认信息
     */
    [key: string]: unknown;
  };
  /**
   * 时间戳
   * - 可选，确认消息的接收时间戳（毫秒）
   */
  timestamp?: number;
}

/**
 * 消息队列配置
 *
 * @description
 * 配置消息队列的默认行为和超时处理逻辑
 */
export interface MessageQueueConfig {
  /**
   * 默认超时时间（毫秒）
   * - 可选，队列项的默认超时时间
   * - 超过此时间将触发超时处理逻辑
   */
  defaultTimeout?: number;
  /**
   * 默认最大重试次数
   * - 可选，队列项的默认最大重试次数
   * - 超过此次数将转为 Failed 状态
   */
  defaultMaxRetries?: number;
  /**
   * 超时检查间隔（毫秒）
   * - 可选，检查队列项超时的间隔时间
   * - 用于定期扫描和超时队列项
   */
  timeoutCheckInterval?: number;
  /**
   * 是否启用超时检查
   * - 可选，是否启用自动超时检查机制
   * - 禁用后需要手动检查超时
   */
  enableTimeoutCheck?: boolean;
  /**
   * 孤立 ACK 最大存活时间（毫秒）
   * - 可选，孤立 ACK（无匹配队列项的确认）的最大存活时间
   * - 超过此时间的孤立 ACK 将被丢弃
   */
  orphanFoxAckMaxAge?: number;
}

/**
 * 消息队列事件类型
 *
 * @description
 * 队列生命周期中可能触发的事件类型
 */
export enum MessageQueueEventType {
  /**
   * 已入队
   * - 新的队列项已成功加入队列
   */
  Enqueued = 'enqueued',
  /**
   * 状态变更
   * - 队列项的处理阶段发生变化
   */
  StatusChanged = 'status_changed',
  /**
   * 已出队
   * - 队列项已完成处理或失败，已从队列中移除
   */
  Dequeued = 'dequeued',
  /**
   * 超时
   * - 队列项在指定时间内未完成处理，触发超时逻辑
   */
  Timeout = 'timeout',
  /**
   * 重试
   * - 队列项处理失败，正在执行重试操作
   */
  Retry = 'retry',
  /**
   * 孤立 ACK 已存储
   * - 收到无匹配队列项的 ACK，已存储以供后续匹配
   */
  OrphanStored = 'orphan_stored',
  /**
   * 孤立 ACK 已重放
   * - 孤立的 ACK 已与匹配的队列项关联并触发状态更新
   */
  OrphanReplayed = 'orphan_replayed',
}

/**
 * 消息队列事件
 *
 * @description
 * 队列生命周期中触发的事件对象，包含事件类型和相关数据
 */
export interface MessageQueueEvent {
  /**
   * 事件类型
   * - 标识具体触发的事件类型
   */
  type: MessageQueueEventType;
  /**
   * 队列项
   * - 关联的队列项对象
   */
  item: MessageQueueItem;
  /**
   * 旧阶段
   * - 可选，状态变更前的处理阶段
   * - 仅用于 StatusChanged 事件
   */
  oldStage?: MessageQueueStageEnum;
  /**
   * 新阶段
   * - 可选，状态变更后的处理阶段
   * - 仅用于 StatusChanged 事件
   */
  newStage?: MessageQueueStageEnum;
  /**
   * 时间戳
   * - 事件触发的时间戳（毫秒）
   */
  timestamp: number;
}

/**
 * 消息队列回调函数类型
 *
 * @description
 * 用于订阅队列事件的回调函数签名
 *
 * @param event - 队列事件对象
 */
export type MessageQueueCallback = (event: MessageQueueEvent) => void;

/**
 * 消息队列 ACK 处理结果
 *
 * @description
 * 处理 ACK 消息后的返回结果，包含处理状态和可能触发的状态事件
 */
export interface MessageQueueAckResult {
  /**
   * 是否已处理
   * - true: ACK 已成功处理并匹配到队列项
   * - false: ACK 未匹配到任何队列项（可能是孤立 ACK）
   */
  handled: boolean;
  /**
   * 状态更新事件
   * - 可选，如果 ACK 触发了消息状态变更，则包含状态更新事件
   * - 用于触发 UI 状态更新
   */
  statusEvent?: MessageStatusUpdatedEvent;
}
