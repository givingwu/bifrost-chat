import type { StateCreator } from 'zustand';
import { ThemeMode, type ThemeState } from '@/interfaces/theme.interface';

/**
 * Theme Slice：主题切换状态。
 */
export interface ThemeSlice {
  theme: ThemeState;
  actions: {
    setTheme: (payload: Partial<ThemeState>) => void;
  };
}

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (
  set,
) => ({
  theme: {
    mode: ThemeMode.System,
  },
  actions: {
    setTheme: (payload: Partial<ThemeState>) =>
      set((state) => ({
        theme: { ...state.theme, ...payload },
      })),
  },
});
