import type { StateCreator } from 'zustand';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { StandardMessage } from '@/interfaces/message.interface';

/**
 * Conversation Slice：消息流与会话状态。
 */
export interface ConversationState {
  /** 当前消息流（按时间排序） */
  messages: StandardMessage[];
  /** 会话列表 */
  conversations: Conversation[];
  /** 当前会话 */
  activeConversation?: Conversation;
}

export interface ConversationSlice {
  conversation: ConversationState;
  actions: {
    appendMessage: (message: StandardMessage) => void;
    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (conversationId: string) => void;
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
    conversations: [],
  },
  actions: {
    appendMessage: (message: StandardMessage) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, message],
        },
      })),
    setConversations: (conversations: Conversation[]) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          conversations,
          activeConversation:
            state.conversation.activeConversation ?? conversations[0],
        },
      })),
    setActiveConversation: (conversationId: string) =>
      set((state) => {
        const activeConversation = state.conversation.conversations.find(
          (item) => item.id === conversationId,
        );
        if (!activeConversation) {
          return state;
        }
        return {
          conversation: {
            ...state.conversation,
            activeConversation: {
              ...activeConversation,
              isActive: true,
            },
            conversations: state.conversation.conversations.map((item) => ({
              ...item,
              isActive: item.id === conversationId,
            })),
          },
        };
      }),
  },
});
