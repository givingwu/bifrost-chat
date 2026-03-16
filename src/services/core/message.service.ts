import type {
  SendAttachmentParams,
  SendAttachmentResult,
} from '@/interfaces/attachment.interface';
import type {
  SendAudioParams,
  SendAudioResult,
} from '@/interfaces/audio.interface';
import type {
  MessageSendResult,
  MessageStatusUpdatedEvent,
  SendMessageOptions,
  StandardMessage,
} from '@/interfaces/message.interface';
import type { AckPacketBody } from '@/interfaces/protocol.interface';

/**
 * 消息列表查询参数（服务层定义）
 *
 * @description
 * 定义在服务契约层，hooks 层的 UseMessagesParams 应 extends 此接口，
 * 保持正确的依赖方向：hooks → service contract。
 */
export interface IMessageListParams {
  /** 分页参数 */
  page?: number;
  /** 当前渠道（可选，用于渠道切换时刷新） */
  currentChannel?: string;
  /** 每页条数 */
  pageSize?: number;
}

/**
 * 实时消息事件
 */
export interface MessageReceivedEvent {
  /** 会话 ID */
  conversationId: string;
  /** 消息内容 */
  message: StandardMessage;
}

/**
 * markAsRead 附加元信息
 *
 * @description
 * SDK 用于将服务端 ACK 与原消息建立关联，宿主可选择透传并使用。
 */
export interface MarkAsReadMeta {
  /** SDK 生成的 ACK 请求 ID */
  requestId: string;
  /** 会话 ID */
  conversationId: string;
  /** 原消息 ID */
  messageId: string;
  /** 渠道类型 */
  channelType?: StandardMessage['channelType'];
}

/**
 * markAsRead 返回结果
 *
 * @description
 * 宿主若使用严格 ACK 确认模式，可返回 ACK 请求 ID。
 */
export interface MarkAsReadResult {
  /** 实际发出的 ACK 请求 ID */
  ackRequestId?: string;
}

/**
 * 消息服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TSendParams 发送参数类型
 * @template TReadParams 已读参数类型
 * @template TAttachmentParams 附件发送参数类型
 * @template TAudioParams 音频发送参数类型
 *
 * @description
 * SDK 定义接口，调用方提供实现。
 * 使用泛型解耦参数类型，允许不同业务方使用不同的 API 参数结构。
 *
 * @example
 * ```typescript
 * // 业务方实现接口
 * class MyMessageService
 *   implements IMessageService<MyListParams, MySendParams, MyReadParams, MyAttachmentParams, MyAudioParams> {
 *   async list(conversationId: string, params: MyListParams): Promise<StandardMessage[]> {
 *     // 自定义实现
 *   }
 *   async send(conversationId: string, params: MySendParams): Promise<MessageSendResult> {
 *     // 自定义实现
 *   }
 *   async markAsRead(params: MyReadParams): Promise<void> {
 *     // 自定义实现
 *   }
 *   async sendAttachment(params: MyAttachmentParams): Promise<SendAttachmentResult> {
 *     // 自定义实现：处理文件上传和发送
 *   }
 *   async sendAudio(params: MyAudioParams): Promise<SendAudioResult> {
 *     // 自定义实现：处理音频上传和发送
 *   }
 * }
 * ```
 */
export interface IMessageService<
  TListParams = IMessageListParams,
  TSendParams = SendMessageOptions,
  TReadParams = AckPacketBody,
  TAttachmentParams = SendAttachmentParams,
  TAudioParams = SendAudioParams,
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
   *
   * @description
   * 电催场景下，宿主通常会在该实现内部先执行
   * `POST /chat/v2/message/check` 频次校验，再调用
   * `POST /chat/v2/message/send`。
   *
   * @param conversationId 会话 ID
   * @param params 发送参数
   * @returns 发送结果
   */
  send(conversationId: string, params: TSendParams): Promise<MessageSendResult>;

  /**
   * 标记消息已读
   * @param params 已读参数
   */
  markAsRead(
    params: TReadParams,
    meta?: MarkAsReadMeta,
  ): Promise<void | MarkAsReadResult>;

  /**
   * 订阅实时消息
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToMessages(
    callback: (event: MessageReceivedEvent) => void,
  ): () => void;

  /**
   * 订阅消息状态更新
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToMessageStatus(
    callback: (event: MessageStatusUpdatedEvent) => void,
  ): () => void;

  /**
   * 发送附件消息
   * @param params 附件发送参数
   * @returns 发送结果
   *
   * @description
   * 调用方负责处理文件上传和消息发送
   *
   * @example
   * ```typescript
   * const result = await messageService.sendAttachment({
   *   conversationId: 'conv-123',
   *   attachments: [{ file: File, type: MessageTypeEnum.Image, size: 1024000, mimeType: 'image/jpeg' }],
   *   text: '查看附件',
   * });
   * ```
   */
  sendAttachment(params: TAttachmentParams): Promise<SendAttachmentResult>;

  /**
   * 发送音频消息
   * @param params 音频发送参数
   * @returns 发送结果
   *
   * @description
   * 调用方负责处理音频处理和消息发送
   *
   * @example
   * ```typescript
   * const result = await messageService.sendAudio({
   *   conversationId: 'conv-123',
   *   audio: { blob: Blob, mimeType: 'audio/webm', duration: 30, size: 1024000 },
   *   format: AudioOutputFormatEnum.Raw,
   * });
   * ```
   */
  sendAudio(params: TAudioParams): Promise<SendAudioResult>;
}
