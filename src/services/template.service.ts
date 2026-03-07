import type { UseTemplatesParams } from '@/hooks/use-templates.hook';
import type { Template } from '@/interfaces/template.interface';

/**
 * 模板预览参数
 */
export interface TemplatePreviewParams extends Required<UseTemplatesParams> {
  /** 模板 code */
  templateCode: Template['code'];
}

/**
 * 模板预览结果
 */
export type TemplatePreviewResult = Template &
  Required<Pick<Template, 'params' | 'previewContent'>>;

/**
 * 模板服务接口 (泛型版本)
 * @template TListParams 列表查询参数类型
 * @template TPreviewParams 预览参数类型
 *
 * @description
 * SDK 定义接口，调用方提供实现。
 * 使用泛型解耦参数类型，允许不同业务方使用不同的 API 参数结构。
 *
 * @example
 * ```typescript
 * // 业务方实现接口
 * class MyTemplateService
 *   implements ITemplateService<MyListParams> {
 *   async list(params: MyListParams): Promise<Template[]> {
 *     // 自定义实现
 *   }
 * }
 * ```
 */
export interface ITemplateService<
  TListParams = UseTemplatesParams,
  TPreviewParams = TemplatePreviewParams,
> {
  /**
   * 获取可用模板列表
   * @param params 查询参数
   * @returns 模板列表
   */
  list(params: TListParams): Promise<Template[]>;

  /**
   * 预览模板（获取参数替换后的预览内容）
   * - 返回完整模板信息供 UI 显示
   * - 返回 params 供发送时使用
   *
   * @param params 预览参数
   * @returns 预览结果（包含模板信息和参数）
   *
   * @example
   * ```typescript
   * const result = await templateService.preview({
   *   conversationId: 'conv-123',
   *   currentChannel: 'whatsapp',
   *   templateCode: 'template-code',
   * });
   * // result - 完整模板对象
   * // result.params - 模板参数（用于发送）
   * // result.content - 预览内容
   * ```
   */
  preview(params: TPreviewParams): Promise<TemplatePreviewResult>;
}
