import { MessageTypeEnum } from '@/interfaces/message.interface';

/**
 * Composer 发送按钮判定参数。
 */
export interface ResolveComposerCanSendParams {
  /** 当前输入内容 */
  value: string;
  /** 当前附件数量 */
  attachmentCount: number;
  /** 是否处于发送中 */
  isSending: boolean;
  /** 当前消息类型 */
  messageType?: MessageTypeEnum;
  /** 模板预览错误 */
  templateError?: string | null;
}

/**
 * 计算 Composer 当前是否允许发送。
 *
 * @param params 判定参数
 * @returns `true` 表示允许发送
 */
export function resolveComposerCanSend(
  params: ResolveComposerCanSendParams,
): boolean {
  const { value, attachmentCount, isSending, messageType, templateError } =
    params;
  const hasContent = value.trim().length > 0 || attachmentCount > 0;
  const hasTemplateError =
    messageType === MessageTypeEnum.Template && Boolean(templateError);

  return hasContent && !isSending && !hasTemplateError;
}
