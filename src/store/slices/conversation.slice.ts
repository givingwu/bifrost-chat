import type { StateCreator } from 'zustand';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import type {
  SendMessageOptions,
  StandardMessage,
} from '@/interfaces/message.interface';
import { MessageBuilder } from '@/utils/message-builder.util';
import type { ChatStoreState } from '..';
import { defaultConversations, defaultMessages } from '../mock/chat.default';

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
    sendMessage: (content?: string, options?: SendMessageOptions) => void;
    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (conversationId: string) => void;
  };
}

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set, get) => ({
  conversation: {
    messages: defaultMessages,
    conversations: defaultConversations,
    activeConversation: defaultConversations[0],
  },
  actions: {
    appendMessage: (message: StandardMessage) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, message],
        },
      })),
    sendMessage: (content?: string, options?: SendMessageOptions) => {
      const state = get() as ChatStoreState;
      const activeConversation = state.conversation.activeConversation;
      const activeChannel = state.strategy.activeChannel;

      // 从 profile 获取 agent 信息
      const agentId = state.profile.profile?.name ?? 'default-agent';

      if (!activeConversation) {
        console.warn(
          '[ConversationSlice] No active conversation to send message',
        );
        return;
      }

      // 验证消息内容
      if (!content || content.trim().length === 0) {
        console.warn('[ConversationSlice] Message content is empty');
        return;
      }

      // 确定渠道类型
      const channelType: ChannelTypeEnum =
        options?.channelType ?? activeConversation.channel ?? activeChannel;

      if (!channelType) {
        console.error('[ConversationSlice] No valid channel type found');
        return;
      }

      try {
        // 使用 MessageBuilder 构建消息
        const message = MessageBuilder.buildTextMessage(content, {
          senderId: agentId,
          receiverId: activeConversation.user.id,
          channelType,
          type: options?.type,
          sender: options?.sender,
          receiver: options?.receiver,
        });

        // 调用 appendMessage 添加到状态
        state.actions.appendMessage(message);
      } catch (error) {
        console.error('[ConversationSlice] Failed to build message:', error);
      }
    },
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
          console.warn(
            `[ConversationSlice] Conversation with id ${conversationId} not found`,
          );
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
