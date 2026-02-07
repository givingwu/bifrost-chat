import type { StateCreator } from 'zustand';
import {
  LanguageCodeEnum,
  type LanguageState,
} from '@/interfaces/language.interface';
import { loadMessagesSync } from '@/utils/i18n.util';

/**
 * Language Slice：语言状态。
 *
 * @description
 * 管理应用的语言状态，包括当前语言代码和对应的文案字典。
 * 支持动态切换语言，并自动加载对应的消息包。
 */
export interface LanguageSlice {
  language: LanguageState;
  actions: {
    setLanguage: (code: LanguageCodeEnum) => void;
  };
}

/**
 * 创建 Language Slice
 *
 * @description
 * 初始化语言状态，默认使用英文（en-US）。
 * 在初始化时同步加载默认语言包，避免异步加载的复杂性。
 */
export const createLanguageSlice: StateCreator<
  LanguageSlice,
  [],
  [],
  LanguageSlice
> = (set) => {
  // 初始化默认语言包
  const defaultCode = LanguageCodeEnum.EnUS;
  const defaultMessages = loadMessagesSync(defaultCode);

  return {
    language: {
      code: defaultCode,
      messages: defaultMessages,
      autoDetect: true,
    },
    actions: {
      setLanguage: (code: LanguageCodeEnum) =>
        set((state) => {
          // 如果语言代码没有变化，不更新状态
          if (state.language.code === code) {
            return state;
          }

          // 加载新语言包
          const messages = loadMessagesSync(code);

          return {
            language: { ...state.language, code, messages },
          };
        }),
    },
  };
};
