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
  },
  actions: {
    setTheme: (mode: ThemeModeEnum) =>
      set((state) => ({
        theme: {
          ...state.theme,
          mode,
          resolvedMode: resolveThemeMode(mode, state.theme.systemPrefersDark),
        },
      })),
    setSystemPrefersDark: (prefersDark: boolean) =>
      set((state) => ({
        theme: {
          ...state.theme,
          systemPrefersDark: prefersDark,
          resolvedMode: resolveThemeMode(state.theme.mode, prefersDark),
        },
      })),
  },
});
