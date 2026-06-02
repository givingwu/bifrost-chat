export const TEMPLATE_SHEET_ID = 'bifrost-mobile-template-sheet';

export const EMPTY_TEMPLATE_PARAMS = {
  conversationId: '',
  currentChannel: undefined,
} as const;

export type TranslationFn = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * 读取翻译文案；当语言包未配置该 key 时回退到默认文案。
 */
export function translateOrFallback(
  t: TranslationFn,
  key: string,
  fallback: string,
  options?: Record<string, unknown>,
): string {
  const value = t(key, options);
  const target = value === key ? fallback : value;

  if (!options) {
    return target;
  }

  return Object.entries(options).reduce((result, [token, optionValue]) => {
    const regex = new RegExp(`{{\\s*${token}\\s*}}`, 'g');
    return result.replace(regex, String(optionValue));
  }, target);
}

/**
 * 生成移动端模板按钮的单行展示文案。
 */
export function formatTemplateLabel(template: {
  name: string;
  content: string;
}): string {
  return template.name
    ? `[${template.name}] ${template.content}`
    : template.content;
}
