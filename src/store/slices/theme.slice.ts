import type { StateCreator } from 'zustand';
import { ThemeModeEnum, type ThemeState } from '@/interfaces/theme.interface';

/**
 * Theme Slice：主题切换状态。
 */
export interface ThemeSlice {
  theme: ThemeState;
  actions: {
    setTheme: (mode: ThemeModeEnum) => void;
  };
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (
  set,
) => ({
  theme: {
    mode: ThemeModeEnum.System,
  },
  actions: {
    setTheme: (mode: ThemeModeEnum) =>
      set((state) => ({
        theme: { ...state.theme, mode },
      })),
  },
});
