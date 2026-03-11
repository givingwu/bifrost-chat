import type { StateCreator } from 'zustand';
import { ThemeModeEnum, type ThemeState } from '@/interfaces/theme.interface';

const resolveThemeMode = (
  mode: ThemeModeEnum,
  systemPrefersDark: boolean,
): ThemeModeEnum.Light | ThemeModeEnum.Dark => {
  if (mode === ThemeModeEnum.System) {
    return systemPrefersDark ? ThemeModeEnum.Dark : ThemeModeEnum.Light;
  }

  return mode === ThemeModeEnum.Dark ? ThemeModeEnum.Dark : ThemeModeEnum.Light;
};

/**
 * Theme Slice：主题切换状态。
 */
export interface ThemeSlice {
  theme: ThemeState;
  actions: {
    setTheme: (mode: ThemeModeEnum) => void;
    setSystemPrefersDark: (prefersDark: boolean) => void;
  };
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (
  set,
) => ({
  theme: {
    mode: ThemeModeEnum.System,
    systemPrefersDark: false,
    resolvedMode: ThemeModeEnum.Light,
    enableSwitcher: true,
  },
  actions: {
    // mode 保留用户设置的原始偏好（含 system），resolvedMode 才是实际渲染值
    setTheme: (mode: ThemeModeEnum) =>
      set((state) => {
        if (!state.theme.enableSwitcher) return state;

        return {
          theme: {
            ...state.theme,
            mode,
            resolvedMode: resolveThemeMode(mode, state.theme.systemPrefersDark),
          },
        };
      }),
    // 系统偏好变化时同步刷新 resolvedMode（仅在 enableSwitcher=true 时生效）
    setSystemPrefersDark: (prefersDark: boolean) =>
      set((state) => {
        if (!state.theme.enableSwitcher) return state;

        return {
          theme: {
            ...state.theme,
            systemPrefersDark: prefersDark,
            resolvedMode: resolveThemeMode(state.theme.mode, prefersDark),
          },
        };
      }),
  },
});
