import type { StateCreator } from 'zustand';

/**
 * Unread Slice：会话未读增量状态。
 *
 * @description
 * 库内不计算未读绝对值，仅维护在订阅方提供的 unreadCount 基础上的实时增量。
 * 展示未读 = max(0, conversation.unreadCount + delta[conversationId])。
 */
export interface UnreadState {
  /** 按会话 ID 的未读增量（可正可负，展示时与 API unreadCount 相加后取 max(0, ...)） */
  unreadDeltaByConversation: Record<string, number>;
}

export interface UnreadSlice {
  unread: UnreadState;
  actions: {
    /** 收到 chat_message 时调用，该会话未读展示 +1 */
    incrementUnread: (conversationId: string) => void;
    /** 收到下行 msg_read_ack 时调用，该会话未读展示 -1 */
    decrementUnread: (conversationId: string) => void;
    /** 用户进入会话时调用，该会话未读增量清零 */
    clearUnread: (conversationId: string) => void;
  };
}

export const createUnreadSlice: StateCreator<
  UnreadSlice,
  [],
  [],
  UnreadSlice
> = (set) => ({
  unread: {
    unreadDeltaByConversation: {},
  },
  actions: {
    incrementUnread: (conversationId: string) =>
      set((state) => {
        const prev =
          state.unread.unreadDeltaByConversation[conversationId] ?? 0;
        return {
          unread: {
            ...state.unread,
            unreadDeltaByConversation: {
              ...state.unread.unreadDeltaByConversation,
              [conversationId]: prev + 1,
            },
          },
        };
      }),

    decrementUnread: (conversationId: string) =>
      set((state) => {
        const prev =
          state.unread.unreadDeltaByConversation[conversationId] ?? 0;
        const next = Math.max(0, prev - 1);
        const nextDelta = { ...state.unread.unreadDeltaByConversation };
        if (next === 0) {
          delete nextDelta[conversationId];
        } else {
          nextDelta[conversationId] = next;
        }
        return {
          unread: {
            ...state.unread,
            unreadDeltaByConversation: nextDelta,
          },
        };
      }),

    clearUnread: (conversationId: string) =>
      set((state) => {
        if (
          state.unread.unreadDeltaByConversation[conversationId] === undefined
        ) {
          return state;
        }
        const nextDelta = { ...state.unread.unreadDeltaByConversation };
        delete nextDelta[conversationId];
        return {
          unread: {
            ...state.unread,
            unreadDeltaByConversation: nextDelta,
          },
        };
      }),
  },
});
