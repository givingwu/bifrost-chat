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
 * 主题切换回调类型
 */
export type ThemeChangeCallback = (newMode: ThemeModeEnum) => void;

/**
 * Theme Slice：主题切换状态
 */
export interface ThemeState {
  /** 用户设置的主题偏好（含 system 语义） */
  mode: ThemeModeEnum;
  /** 计算后的实际渲染模式（只有 light/dark，供 CSS class 使用） */
  resolvedMode: ThemeModeEnum.Light | ThemeModeEnum.Dark;
  /** 系统是否偏好深色 */
  systemPrefersDark: boolean;
  /** 是否启用主题切换器 */
  enableSwitcher?: boolean;
}
