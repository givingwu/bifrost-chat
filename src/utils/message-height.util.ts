import {
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';

/**
 * 估算消息高度（用于虚拟滚动初始化）
 *
 * @description
 * 根据消息类型和内容估算消息的初始高度。
 * 虚拟滚动会使用这个值作为初始估算，然后通过 measureElement 动态测量实际高度。
 *
 * @param message - 标准消息对象
 * @returns 估算的消息高度（像素）
 *
 * @example
 * ```typescript
 * const height = estimateMessageHeight(message);
 * // 文本消息：40-200px（根据内容长度）
 * // 图片消息：200px
 * // 视频消息：180px
 * // 语音消息：60px
 * // 文件消息：80px
 * // 系统消息：30px
 * ```
 */
export function estimateMessageHeight(message: StandardMessage): number {
  switch (message.type) {
    case MessageTypeEnum.Text: {
      // 文本消息：根据内容长度估算
      const textLength = getTextLength(message);
      // 基础高度 40px，每 10 个字符增加 1px，最大 200px
      return Math.min(Math.max(40, Math.ceil(textLength / 10) + 40), 200);
    }

    case MessageTypeEnum.Image:
      // 图片消息：默认高度 200px（考虑宽高比和加载状态）
      return 200;

    case MessageTypeEnum.Video:
      // 视频消息：默认高度 180px
      return 180;

    case MessageTypeEnum.Audio:
      // 语音消息：固定高度 60px
      return 60;

    case MessageTypeEnum.File:
      // 文件消息：固定高度 80px
      return 80;

    case MessageTypeEnum.Location:
      // 位置消息：默认高度 150px
      return 150;

    case MessageTypeEnum.RichMedia:
      // 富媒体消息：默认高度 120px
      return 120;

    case MessageTypeEnum.Template: {
      // 模板消息：根据内容长度估算
      const templateTextLength = getTextLength(message);
      return Math.min(
        Math.max(60, Math.ceil(templateTextLength / 10) + 60),
        250,
      );
    }

    case MessageTypeEnum.Other:
      // 系统消息：固定高度 30px
      return 30;

    default:
      // 未知类型：默认高度 60px
      return 60;
  }
}

/**
 * 获取消息文本长度
 *
 * @param message - 标准消息对象
 * @returns 文本长度
 */
function getTextLength(message: StandardMessage): number {
  if ('text' in message.content && typeof message.content.text === 'string') {
    return message.content.text.length;
  }
  return 0;
}

/**
 * 消息高度缓存（用于性能优化）
 *
 * @description
 * 缓存已测量的消息高度，避免重复计算。
 * 使用 WeakMap 自动清理不再使用的消息对象。
 */
const messageHeightCache = new WeakMap<StandardMessage, number>();

/**
 * 获取缓存的消息高度
 *
 * @param message - 标准消息对象
 * @returns 缓存的高度，如果不存在则返回 undefined
 */
export function getCachedMessageHeight(
  message: StandardMessage,
): number | undefined {
  return messageHeightCache.get(message);
}

/**
 * 设置缓存的消息高度
 *
 * @param message - 标准消息对象
 * @param height - 消息高度
 */
export function setCachedMessageHeight(
  message: StandardMessage,
  height: number,
): void {
  messageHeightCache.set(message, height);
}

/**
 * 清除消息高度缓存
 *
 * @description
 * 在某些情况下（如消息内容更新），需要清除缓存以重新测量高度。
 *
 * @param message - 标准消息对象
 */
export function clearCachedMessageHeight(message: StandardMessage): void {
  messageHeightCache.delete(message);
}
