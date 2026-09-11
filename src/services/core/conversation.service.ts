import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { IMessageListParams } from './message.service';

export interface IConversationParams extends IMessageListParams {
  /** 渠道类型（可选，用于按渠道筛选会话） */
  channelType?: ChannelTypeEnum;
}

/**
 * 支持的渠道会话信息
 *
 * @description
 * 用于描述一个会话在各渠道下的状态：
 * - channelType: 渠道类型
 * - conversationId: 该渠道下的会话ID
 *
 * 宿主层在传入 SDK 前需要将 chatId 转换为 conversationId。
 */
export interface SupportedChannelSession {
  /** 会话ID（SDK 统一命名） */
  conversationId: string;
  /** 渠道类型 */
  channelType: ChannelTypeEnum;
}

/**
 * 会话元数据基础结构
 *
 * @description
 * - supportedChannels: 支持的渠道类型列表（用于 UI 渲染渠道图标）
 * - supportedChannelSessions: 支持的渠道会话详情（用于渠道切换时获取 chatId）
 *
 * 注意：宿主层可能直接在 metadata.supportedChannels 中传递对象数组，
 * useConversationMetadata hook 会自动处理这种格式。
 */
export interface ConversationMetadata {
  /** 支持的渠道类型列表 */
  supportedChannels?: ChannelTypeEnum[];
  /** 支持的渠道会话详情 */
  supportedChannelSessions?: SupportedChannelSession[];
}

/**
 * 未读数量查询参数
 */
export interface UnreadCountParams {
  /** 逻辑会话下的全部渠道会话 ID（可选，不传则查询全部会话） */
  conversationIds?: string[];
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
 *     const response = await fetch('/api/conversations', {
 *       method: 'POST',
 *       body: JSON.stringify(params)
 *     });
 *     const json = await response.json();
 *     return {
 *       data: json.data,
 *       total: json.total
 *     };
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
  TListParams = IConversationParams,
  TCreateParams = unknown,
  TQueryParams = unknown,
> {
  /**
   * 获取会话列表（分页）
   *
   * @description
   * 返回标准的分页响应格式，包含数据列表和总记录数。
   * SDK 使用 `total` 字段判断是否还有下一页。
   *
   * @param params 查询参数（可选）
   * @returns 分页响应，包含数据列表和总记录数
   */
  list(params?: TListParams): Promise<Conversation[]>;

  /**
   * 获取会话详情
   *
   * @description
   * 用于“已知 chatId，获取完整会话 info”的场景。
   * 宿主可将其映射到 `POST /chat/v2/session/info`。
   *
   * @param conversationId 会话 ID
   * @returns 会话详情，如果不存在返回 null
   */
  get(conversationId: string): Promise<Conversation | null>;

  /**
   * 创建会话
   *
   * @description
   * 对电催新接口，宿主通常将该能力映射到 `POST /chat/v2/session/info`：
   * - 新建入口：传 `debtorId/contactId/channelType`
   * - 渠道切换：传 `sourceChatId/channelType`
   *
   * @param params 创建参数
   * @returns 新创建的会话
   */
  create(params: TCreateParams): Promise<Conversation>;

  /**
   * 查询会话
   *
   * @description
   * 宿主可按场景映射到：
   * - `POST /chat/v2/session/query`：IM 上行消息反查会话
   * - `POST /chat/v2/session/info`：前端按 chatId 查询当前会话详情
   *
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
   * 获取未读数量
   *
   * @description
   * 后端接口由宿主定义，下方 /messaging/chat/unread 仅为示例。
   * 业务方在实现时自行注入 app/pin 等鉴权参数；
   * SDK 只传递可选的 channelType 和 conversationIds 过滤条件。
   *
   * @param params 查询参数（可选）
   * @returns 未读数量结果
   *
   * @example
   * ```typescript
   * class MyConversationService implements IConversationService {
   *   async getUnreadCount(params) {
   *     const res = await fetch('/messaging/chat/unread', {
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
