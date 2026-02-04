/**
 * 主题模式枚举
 */
export enum ThemeModeEnum {
  /** 跟随系统 */
  System = 'system',
  /** 浅色模式 */
  Light = 'light',
  /** 深色模式 */
  Dark = 'dark',
}

/**
 * Theme Slice：主题切换状态
 */
export interface ThemeState {
  /** 主题模式 */
  mode: ThemeModeEnum;
}
