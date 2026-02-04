/**
 * @description Language related interfaces and enums
 */
export enum LanguageCodeEnum {
  /** 英文（美国） */
  EnUS = 'en-US',
  /** 中文（简体） */
  ZhCN = 'zh-CN',
}

/**
 * 可用的语言代码列表
 */
export const AvailableLanguageCodes = [
  LanguageCodeEnum.EnUS,
  LanguageCodeEnum.ZhCN,
] as const;

/**
 * 语言状态接口
 */
export type LanguageState = {
  code: LanguageCodeEnum;
};

/**
 * 语言代码类型别名（向后兼容）
 */
export type LanguageCode = LanguageCodeEnum;
