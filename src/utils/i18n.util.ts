import {
  type I18nMessages,
  LanguageCodeEnum,
} from '@/interfaces/language.interface';
import enUSMessages from '@/locales/en-US.json';
import zhCNMessages from '@/locales/zh-CN.json';

/**
 * 动态导入语言包
 *
 * @description
 * 根据语言代码动态加载对应的 messages 文件。
 * 使用动态导入以支持按需加载和代码分割。
 *
 * @param code - 语言代码
 * @returns Promise<I18nMessages> - 语言包
 *
 * @example
 * ```ts
 * const messages = await loadMessages(LanguageCodeEnum.ZhCN);
 * ```
 */
export async function loadMessages(
  code: LanguageCodeEnum,
): Promise<I18nMessages> {
  switch (code) {
    case LanguageCodeEnum.ZhCN: {
      const zhCN = await import('@/locales/zh-CN.json');
      return zhCN.default;
    }
    default: {
      const enUS = await import('@/locales/en-US.json');
      return enUS.default;
    }
  }
}

/**
 * 同步加载语言包（用于初始化）
 *
 * @description
 * 在 store 初始化时同步加载默认语言包。
 * 使用静态导入确保在测试环境中也能正常工作。
 *
 * @param code - 语言代码
 * @returns I18nMessages - 语言包
 *
 * @example
 * ```ts
 * const messages = loadMessagesSync(LanguageCodeEnum.EnUS);
 * ```
 */
export function loadMessagesSync(code: LanguageCodeEnum): I18nMessages {
  switch (code) {
    case LanguageCodeEnum.ZhCN:
      return zhCNMessages;
    case LanguageCodeEnum.EnUS:
      return enUSMessages;
    default:
      return enUSMessages;
  }
}

/**
 * 创建翻译函数
 *
 * @description
 * 根据 messages 创建翻译函数 t，支持插值和嵌套路径。
 *
 * @param messages - 语言包
 * @returns t 函数
 *
 * @example
 * ```ts
 * const t = createTFunction(messages);
 * t('common.loading'); // "加载中..."
 * t('composer.placeholder.channel', { channel: 'SMS' }); // "输入 SMS 内容"
 * ```
 */
export function createTFunction(messages: I18nMessages) {
  return (key: string, options?: Record<string, unknown>): string => {
    const parts = key.split('.');
    let current: unknown = messages;

    // 遍历嵌套路径
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        return key; // 路径不存在，返回 key
      }
      current = (current as Record<string, unknown>)[part];
    }

    // 检查最终值是否为字符串
    if (typeof current !== 'string') {
      return key; // 值不是字符串，返回 key
    }

    // 如果没有插值参数，直接返回
    if (!options) {
      return current;
    }

    // 处理插值：{{ variable }}
    return Object.entries(options).reduce((result, [token, value]) => {
      const safeValue = String(value);
      const regex = new RegExp(`{{\\s*${token}\\s*}}`, 'g');
      return result.replace(regex, safeValue);
    }, current);
  };
}
