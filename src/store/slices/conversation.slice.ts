import type { StateCreator } from 'zustand';
import type { StandardMessage } from '@/interfaces/message.interface';

/**
 * Conversation Slice：消息流与会话状态。
 */
export interface ConversationState {
  /** 当前消息流（按时间排序） */
  messages: StandardMessage[];
}

export interface ConversationSlice {
  conversation: ConversationState;
  actions: {
    appendMessage: (message: StandardMessage) => void;
  };
}

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set) => ({
  conversation: {
    messages: [],
  },
  actions: {
    appendMessage: (message: StandardMessage) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, message],
        },
      })),
  },
});
