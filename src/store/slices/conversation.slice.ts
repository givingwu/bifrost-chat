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
}

export interface ConversationSlice {
  conversation: ConversationState;
  actions: {
    setActiveConversationId: (conversationId: string | null) => void;
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
  },
  actions: {
    setActiveConversationId: (conversationId: string | null) =>
      set(() => ({
        conversation: {
          activeConversationId: conversationId,
        },
      })),
  },
});
