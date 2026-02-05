import type { MessageSendResult } from '../interfaces/message.interface';

/**
 * 模版变量
 */
export interface TemplateVariable {
  /** 变量键名 */
  key: string;
  /** 变量标签 */
  label: string;
  /** 变量类型 */
  type: 'text' | 'number' | 'date' | 'image' | 'document';
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 示例值 */
  example?: string;
}

/**
 * 消息模版
 */
export interface Template {
  /** 模版 ID */
  id: string;
  /** 模版名称 */
  name: string;
  /** 模版内容 */
  content: string;
  /** 模版分类 */
  category?: string;
  /** 模版语言 */
  language?: string;
  /** 模版变量 */
  variables?: TemplateVariable[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 是否已启用 */
  enabled?: boolean;
}

/**
 * 模版服务接口 (泛型版本)
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
   * 获取可用模版列表
   * @param params 查询参数
   * @returns 模版列表
   */
  list(params: TListParams): Promise<Template[]>;

  /**
   * 发送模版消息
   * @param params 发送参数
   * @returns 发送结果
   */
  send(params: TSendParams): Promise<MessageSendResult>;

  /**
   * 预览模版
   * @param templateId 模版 ID
   * @param variables 模版变量值
   * @returns 预览内容
   */
  preview?(
    templateId: string,
    variables: Record<string, string>,
  ): Promise<string>;
}
