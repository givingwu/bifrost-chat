import { create } from 'zustand';
import type { ContextSlice, ContextState } from './slices/context.slice';
import { createContextSlice } from './slices/context.slice';
import type {
  ConversationSlice,
  ConversationState,
} from './slices/conversation.slice';
import { createConversationSlice } from './slices/conversation.slice';
import type { LanguageSlice } from './slices/language.slice';
import { createLanguageSlice } from './slices/language.slice';
import type { NetworkSlice } from './slices/network.slice';
import { createNetworkSlice } from './slices/network.slice';
import type { StrategySlice, StrategyState } from './slices/strategy.slice';
import { createStrategySlice } from './slices/strategy.slice';
import type { ThemeSlice } from './slices/theme.slice';
import { createThemeSlice } from './slices/theme.slice';
import type { UiSlice, UiState } from './slices/ui.slice';
import { createUiSlice } from './slices/ui.slice';

export type { UiState, StrategyState, ConversationState, ContextState };

export type ChatStoreState = UiSlice &
  StrategySlice &
  NetworkSlice &
  ThemeSlice &
  LanguageSlice &
  ConversationSlice &
  ContextSlice;

/**
 * useChatStore：SDK 内部 Zustand Store（Singleton）
 */
export const useChatStore = create<ChatStoreState>()((...args) => ({
  ...(() => {
    const uiSlice = createUiSlice(...args);
    const strategySlice = createStrategySlice(...args);
    const networkSlice = createNetworkSlice(...args);
    const themeSlice = createThemeSlice(...args);
    const languageSlice = createLanguageSlice(...args);
    const conversationSlice = createConversationSlice(...args);
    const contextSlice = createContextSlice(...args);

    return {
      ...uiSlice,
      ...strategySlice,
      ...networkSlice,
      ...themeSlice,
      ...languageSlice,
      ...conversationSlice,
      ...contextSlice,
      actions: {
        ...uiSlice.actions,
        ...strategySlice.actions,
        ...networkSlice.actions,
        ...themeSlice.actions,
        ...languageSlice.actions,
        ...conversationSlice.actions,
        ...contextSlice.actions,
      },
    };
  })(),
}));
