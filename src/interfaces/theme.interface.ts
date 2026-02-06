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
 * 主题颜色方案
 */
export interface ThemeColors {
  /** 主色调 */
  primary: string;
  /** 次要色调 */
  secondary: string;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
  /** 信息色 */
  info: string;
  /** 背景色 */
  background: string;
  /** 表面色 */
  surface: string;
  /** 文本色 */
  text: string;
  /** 次要文本色 */
  textSecondary: string;
  /** 边框色 */
  border: string;
  /** 禁用色 */
  disabled: string;
}

/**
 * 主题间距配置
 */
export interface ThemeSpacing {
  /** 极小间距 */
  xs: string;
  /** 小间距 */
  sm: string;
  /** 中等间距 */
  md: string;
  /** 大间距 */
  lg: string;
  /** 极大间距 */
  xl: string;
}

/**
 * 主题圆角配置
 */
export interface ThemeRadius {
  /** 小圆角 */
  sm: string;
  /** 中等圆角 */
  md: string;
  /** 大圆角 */
  lg: string;
  /** 完全圆角 */
  full: string;
}

/**
 * 主题阴影配置
 */
export interface ThemeShadows {
  /** 小阴影 */
  sm: string;
  /** 中等阴影 */
  md: string;
  /** 大阴影 */
  lg: string;
  /** 内阴影 */
  inner: string;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 颜色方案 */
  colors: Partial<ThemeColors>;
  /** 间距配置 */
  spacing?: Partial<ThemeSpacing>;
  /** 圆角配置 */
  radius?: Partial<ThemeRadius>;
  /** 阴影配置 */
  shadows?: Partial<ThemeShadows>;
}

/**
 * 主题切换回调类型
 */
export type ThemeChangeCallback = (newMode: ThemeModeEnum) => void;

/**
 * Theme Slice：主题切换状态
 */
export interface ThemeState {
  /** 主题模式 */
  mode: ThemeModeEnum;
  /** 系统是否偏好深色 */
  systemPrefersDark: boolean;
  /** 最终解析后的主题模式（仅 light / dark） */
  resolvedMode: ThemeModeEnum;
  /** 自定义主题配置 */
  customConfig?: ThemeConfig;
}
