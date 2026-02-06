import type { StateCreator } from 'zustand';

/**
 * Conversation Slice：客户端会话状态。
 *
 * @description
 * 只保留客户端状态，服务端状态（conversations、messages）由 React Query 管理。
 */
export interface ConversationState {
  /** 当前激活的会话 ID（用于 UI 高亮，不是数据源） */
  activeConversationId: string | null;
  /** 会话列表搜索关键词 */
  searchQuery: string;
}

/**
 * 会话状态切片
 */
export interface ConversationSlice {
  conversation: ConversationState;
  actions: {
    setActiveConversationId: (conversationId: string | null) => void;
    setSearchQuery: (query: string) => void;
  };
}

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set) => ({
  conversation: {
    activeConversationId: null,
    searchQuery: '',
  },
  actions: {
    setActiveConversationId: (conversationId: string | null) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          activeConversationId: conversationId,
        },
      })),
    setSearchQuery: (query: string) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          searchQuery: query,
        },
      })),
  },
});
