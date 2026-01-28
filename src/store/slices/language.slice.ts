import type { StateCreator } from 'zustand';
import {
  LanguageCode,
  type LanguageState,
} from '@/interfaces/language.interface';

/**
 * Language Slice：语言状态。
 */
export interface LanguageSlice {
  language: LanguageState;
  actions: {
    setLanguage: (payload: Partial<LanguageState>) => void;
  };
}

export const createLanguageSlice: StateCreator<
  LanguageSlice,
  [],
  [],
  LanguageSlice
> = (set) => ({
  language: {
    code: LanguageCode.EnUS,
  },
  actions: {
    setLanguage: (payload: Partial<LanguageState>) =>
      set((state) => ({
        language: { ...state.language, ...payload },
      })),
  },
});
