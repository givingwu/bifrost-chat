import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { INPUT_LIMITS } from './composer.constants';

/**
 * 按渠道解析默认自定义消息字数限制。
 *
 * @param channel - 当前渠道
 * @returns 当前渠道默认可输入的最大字数
 */
export function getDefaultComposerMaxLength(channel?: ChannelTypeEnum): number {
  switch (channel) {
    case ChannelTypeEnum.SMS:
      return INPUT_LIMITS.SMS_MAX_LENGTH;
    case ChannelTypeEnum.WhatsApp:
      return INPUT_LIMITS.WHATSAPP_MAX_LENGTH;
    case ChannelTypeEnum.Viber:
      return INPUT_LIMITS.WABA_MAX_LENGTH;
    default:
      return INPUT_LIMITS.DEFAULT_MAX_LENGTH;
  }
}

/**
 * 解析当前输入应采用的自定义消息字数限制。
 *
 * @description
 * 优先级：
 * 1. 组件 props 显式传入的 `maxLength`
 * 2. `composer.customMessageMaxLength`
 * 3. SDK 按渠道内置的默认限制
 *
 * @param options - 解析参数
 * @returns 当前应生效的自定义消息字数限制
 */
export function resolveCustomMessageMaxLength(options: {
  channel?: ChannelTypeEnum;
  maxLength?: number;
  customMessageMaxLength?: number;
}): number {
  const { channel, maxLength, customMessageMaxLength } = options;

  return (
    maxLength ?? customMessageMaxLength ?? getDefaultComposerMaxLength(channel)
  );
}

/**
 * 判断模板消息是否应跳过字数限制。
 *
 * @param options - 判断参数
 * @returns `true` 表示模板消息不受字数限制
 */
export function shouldIgnoreComposerMaxLength(options: {
  isTemplateMessage: boolean;
  ignoreMaxLengthForTemplateMessages?: boolean;
}): boolean {
  const { isTemplateMessage, ignoreMaxLengthForTemplateMessages = true } =
    options;

  return isTemplateMessage && ignoreMaxLengthForTemplateMessages;
}

/**
 * 按当前最大长度裁剪输入值。
 *
 * @param value - 原始输入值
 * @param maxLength - 当前应生效的最大长度；缺省表示不限制
 * @returns 裁剪后的输入值
 */
export function clampComposerValue(value: string, maxLength?: number): string {
  if (maxLength === undefined) {
    return value;
  }

  return value.slice(0, Math.max(0, maxLength));
}
