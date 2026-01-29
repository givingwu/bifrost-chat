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
    setLanguage: (code: LanguageCode) => void;
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
    setLanguage: (code: LanguageCode) =>
      set((state) => ({
        language: { ...state.language, code },
      })),
  },
});
