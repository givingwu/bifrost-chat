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
 * 可用的语言代码列表（使用 as const 确保类型安全）
 */
export const AvailableLanguageCodes = [
  LanguageCodeEnum.EnUS,
  LanguageCodeEnum.ZhCN,
] as const;

/**
 * 语言代码联合类型
 */
export type AvailableLanguageCode = (typeof AvailableLanguageCodes)[number];

/**
 * i18n 文案字典类型
 */
export type I18nMessages = Record<string, unknown>;

/**
 * 语言状态接口
 */
export interface LanguageState {
  /** 当前语言代码 */
  code: LanguageCodeEnum;
  /** 当前语言的文案字典 */
  messages: I18nMessages;
  /** 是否自动检测语言 */
  autoDetect?: boolean;
  /** 是否启用语言切换器 */
  enableSwitcher?: boolean;
}

/**
 * 语言切换回调类型
 */
export type LanguageChangeCallback = (newCode: LanguageCodeEnum) => void;

/**
 * 语言资源接口
 */
export interface LanguageResources {
  [key: string]: string | LanguageResources;
}

/**
 * 语言包接口
 */
export interface LanguageBundle {
  /** 语言代码 */
  code: LanguageCodeEnum;
  /** 语言名称 */
  name: string;
  /** 语言资源 */
  resources: LanguageResources;
}
