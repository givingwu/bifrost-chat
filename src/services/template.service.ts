import type { MessageSendResult } from '../interfaces/message.interface';
import type { Template } from '../interfaces/template.interface';

/**
 * 模板服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TSendParams 发送参数类型
 *
 * @description
 * SDK 定义接口，调用方提供实现。
 * 使用泛型解耦参数类型，允许不同业务方使用不同的 API 参数结构。
 *
 * @example
 * ```typescript
 * // 业务方实现接口
 * class MyTemplateService
 *   implements ITemplateService<MyListParams, MySendParams> {
 *   async list(params: MyListParams): Promise<Template[]> {
 *     // 自定义实现
 *   }
 *   async send(params: MySendParams): Promise<MessageSendResult> {
 *     // 自定义实现
 *   }
 * }
 * ```
 */
export interface ITemplateService<TListParams = any, TSendParams = any> {
  /**
   * 获取可用模板列表
   * @param params 查询参数
   * @returns 模板列表
   */
  list(params: TListParams): Promise<Template[]>;

  /**
   * 发送模板消息
   * @param params 发送参数
   * @returns 发送结果
   */
  send(params: TSendParams): Promise<MessageSendResult>;

  /**
   * 预览模板
   * @param templateId 模板 ID
   * @param variables 模板变量值
   * @returns 预览内容
   */
  preview?(
    templateId: string,
    variables: Record<string, string>,
  ): Promise<string>;
}
