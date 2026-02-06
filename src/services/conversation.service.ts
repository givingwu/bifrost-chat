import type { Conversation } from '@/interfaces/conversation.interface';

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
}
