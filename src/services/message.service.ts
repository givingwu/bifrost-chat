import type {
  MessageSendResult,
  SendMessageOptions,
  StandardMessage,
} from '@/interfaces/message.interface';

/**
 * 消息状态更新
 */
export interface MessageStatusUpdate {
  /** 消息 ID */
  messageId: string;
  /** 临时消息 ID */
  tempId?: string;
  /** 新状态 */
  status: StandardMessage['status'];
  /** 更新时间戳 */
  timestamp: number;
}

/**
 * 消息服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TSendParams 发送参数类型
 * @template TReadParams 已读参数类型
 *
 * @description
 * SDK 定义接口，调用方提供实现。
 * 使用泛型解耦参数类型，允许不同业务方使用不同的 API 参数结构。
 *
 * @example
 * ```typescript
 * // 业务方实现接口
 * class MyMessageService
 *   implements IMessageService<MyListParams, MySendParams, MyReadParams> {
 *   async list(conversationId: string, params: MyListParams): Promise<StandardMessage[]> {
 *     // 自定义实现
 *   }
 *   async send(conversationId: string, params: MySendParams): Promise<MessageSendResult> {
 *     // 自定义实现
 *   }
 *   async markAsRead(params: MyReadParams): Promise<void> {
 *     // 自定义实现
 *   }
 * }
 * ```
 */
export interface IMessageService<
  TListParams = any,
  TSendParams = any,
  TReadParams = any,
> {
  /**
   * 获取消息列表
   * @param conversationId 会话 ID
   * @param params 查询参数
   * @returns 消息列表
   */
  list(conversationId: string, params: TListParams): Promise<StandardMessage[]>;

  /**
   * 发送消息
   * @param conversationId 会话 ID
   * @param params 发送参数
   * @returns 发送结果
   */
  send(conversationId: string, params: TSendParams): Promise<MessageSendResult>;

  /**
   * 标记消息已读
   * @param params 已读参数
   */
  markAsRead(params: TReadParams): Promise<void>;

  /**
   * 订阅实时消息
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToMessages(callback: (message: StandardMessage) => void): () => void;

  /**
   * 订阅消息状态更新
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToMessageStatus(
    callback: (update: MessageStatusUpdate) => void,
  ): () => void;
}
