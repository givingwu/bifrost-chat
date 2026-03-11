import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';

/**
 * 会话元数据基础结构
 * SDK 层使用 supportedChannels，业务数据通过扩展字段传递
 */
export interface ConversationMetadata
  extends Pick<Conversation, 'supportedChannels'> {}

/**
 * 未读数量查询参数
 */
export interface UnreadCountParams {
  /** 会话 ID（可选，不传则查询全部会话） */
  conversationId?: string;
  /** 渠道类型（可选，不传则查询全部渠道） */
  channelType?: string;
}

/**
 * 未读数量结果
 */
export type UnreadCountResult = Partial<Record<ChannelTypeEnum, number>>;

/**
 * 会话服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TCreateParams 创建参数类型
 * @template TQueryParams 查询参数类型
 * @template TMetadataParams 获取元数据的参数类型
 *
 * @description
 * SDK 定义接口，调用方提供实现。
 * 使用泛型解耦参数类型，允许不同业务方使用不同的 API 参数结构。
 *
 * @example
 * ```typescript
 * // 业务方实现接口
 * class MyConversationService
 *   implements IConversationService<MyListParams, MyCreateParams, MyQueryParams> {
 *   async list(params?: MyListParams): Promise<Conversation[]> {
 *     // 自定义实现
 *   }
 *   async get(conversationId: string): Promise<Conversation | null> {
 *     // 自定义实现
 *   }
 *   async create(params: MyCreateParams): Promise<Conversation> {
 *     // 自定义实现
 *   }
 *   async query(params: MyQueryParams): Promise<Conversation | null> {
 *     // 自定义实现
 *   }
 * }
 * ```
 */
export interface IConversationService<
  TListParams = any,
  TCreateParams = any,
  TQueryParams = any,
  TMetadataParams extends Pick<Conversation, 'id'> = Pick<Conversation, 'id'>,
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
> {
  /**
   * 获取会话列表
   * @param params 查询参数（可选）
   * @returns 会话列表
   */
  list(params?: TListParams): Promise<Conversation[]>;

  /**
   * 获取会话详情
   * @param conversationId 会话 ID
   * @returns 会话详情，如果不存在返回 null
   */
  get(conversationId: string): Promise<Conversation | null>;

  /**
   * 创建会话
   * @param params 创建参数
   * @returns 新创建的会话
   */
  create(params: TCreateParams): Promise<Conversation>;

  /**
   * 查询会话
   * @param params 查询参数
   * @returns 会话详情，如果不存在返回 null
   */
  query(params: TQueryParams): Promise<Conversation | null>;

  /**
   * 订阅会话列表更新
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToListUpdates?(
    callback: (conversations: Conversation[]) => void,
  ): () => void;

  /**
   * 订阅会话详情更新
   * @param conversationId 会话 ID
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribeToConversationUpdates?(
    conversationId: string,
    callback: (conversation: Conversation) => void,
  ): () => void;

  /**
   * 获取会话元数据
   * - SDK 层使用 supportedChannels
   * - 业务数据通过返回值的扩展字段传递
   *
   * @param params 查询参数
   * @returns 会话元数据（包含 supportedChannels 和业务 metadata）
   *
   * @example
   * ```typescript
   * const metadata = await conversationService.getMetadata({ conversationId: 'conv-123' });
   * // metadata.supportedChannels - SDK 使用
   * // metadata.agentPin, metadata.customerPin... - 业务数据
   * ```
   */
  getMetadata?(params: TMetadataParams): Promise<TConversationMetadata>;

  /**
   * 获取未读数量
   *
   * @description
   * 对应后端接口 /bifrost-hermod/chat/unread。
   * 业务方在实现时自行注入 app/pin 等鉴权参数；
   * SDK 只传递可选的 channelType 和 chatId 过滤条件。
   *
   * @param params 查询参数（可选）
   * @returns 未读数量结果
   *
   * @example
   * ```typescript
   * class MyConversationService implements IConversationService {
   *   async getUnreadCount(params) {
   *     const res = await fetch('/bifrost-hermod/chat/unread', {
   *       method: 'POST',
   *       body: JSON.stringify({ app: this.app, pin: this.pin, ...params }),
   *     });
   *     const { data } = await res.json();
   *     return {
   *       byChannel: { sms: data.sms, whatsapp: data.whatsapp },
   *       total: Object.values(data).reduce((s, n) => s + n, 0),
   *     };
   *   }
   * }
   * ```
   */
  getUnreadCount?(params?: UnreadCountParams): Promise<UnreadCountResult>;
}
