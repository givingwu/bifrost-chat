import type { StateCreator } from 'zustand';
import {
  LanguageCodeEnum,
  type LanguageState,
} from '@/interfaces/language.interface';

/**
 * Language Slice：语言状态。
 */
export interface LanguageSlice {
  language: LanguageState;
  actions: {
    setLanguage: (code: LanguageCodeEnum) => void;
  };
}

export const createLanguageSlice: StateCreator<
  LanguageSlice,
  [],
  [],
  LanguageSlice
> = (set) => ({
  language: {
    code: LanguageCodeEnum.EnUS,
  },
  actions: {
    setLanguage: (code: LanguageCodeEnum) =>
      set((state) => ({
        language: { ...state.language, code },
      })),
  },
});
