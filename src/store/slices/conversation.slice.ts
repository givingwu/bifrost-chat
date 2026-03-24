import type { StateCreator } from 'zustand';

/**
 * Conversation Slice：客户端会话状态。
 *
 * @description
 * 只保留客户端状态，服务端状态（conversations、messages）由 React Query 管理。
 */
export interface ConversationState {
  /** 当前激活的会话 ID（用于 UI 高亮，不是数据源） */
  activeConversationId: string;
  /** 会话列表搜索关键词 */
  searchQuery: string;
  /** 置顶的会话 ID 集合（临时置顶，用于特定场景） */
  pinnedConversationIds: Set<string>;
}

/**
 * 会话状态切片
 */
export interface ConversationSlice {
  conversation: ConversationState;
  actions: {
    setActiveConversationId: (
      conversationId: string,
      options?: { pinToTop?: boolean },
    ) => void;
    setSearchQuery: (query: string) => void;
    unpinConversation: (conversationId: string) => void;
    clearPinnedConversations: () => void;
  };
}

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set) => ({
  conversation: {
    activeConversationId: '',
    searchQuery: '',
    pinnedConversationIds: new Set<string>(),
  },
  actions: {
    setActiveConversationId: (
      conversationId: string,
      options?: { pinToTop?: boolean },
    ) =>
      set((state) => {
        const pinnedConversationIds = new Set(
          state.conversation.pinnedConversationIds,
        );

        // 如果需要置顶，添加到置顶集合
        if (options?.pinToTop) {
          pinnedConversationIds.add(conversationId);
        }

        return {
          conversation: {
            ...state.conversation,
            activeConversationId: conversationId,
            pinnedConversationIds,
          },
        };
      }),
    setSearchQuery: (query: string) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          searchQuery: query,
        },
      })),
    unpinConversation: (conversationId: string) =>
      set((state) => {
        const pinnedConversationIds = new Set(
          state.conversation.pinnedConversationIds,
        );
        pinnedConversationIds.delete(conversationId);

        return {
          conversation: {
            ...state.conversation,
            pinnedConversationIds,
          },
        };
      }),
    clearPinnedConversations: () =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          pinnedConversationIds: new Set<string>(),
        },
      })),
  },
});
