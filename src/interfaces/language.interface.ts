/**
 * @description Language related interfaces and enums
 */
export enum LanguageCode {
  /** 英文（美国） */
  EnUS = 'en-US',
  /** 中文（简体） */
  ZhCN = 'zh-CN',
}

/**
 * 可用的语言代码列表
 */
export const AvailableLanguageCodes = [
  LanguageCode.EnUS,
  LanguageCode.ZhCN,
] as const;

/**
 * 语言状态接口
 */
export type LanguageState = {
  code: LanguageCode;
};
