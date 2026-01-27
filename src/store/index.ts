import { create, type StateCreator } from 'zustand';
import type { ChannelType, StandardMessage } from '@/interfaces/chat.interface';

/**
 * UI Slice：控制聊天框显隐、加载态等 UI 状态。
 */
export interface UiState {
  /** 是否打开聊天窗口 */
  isOpen: boolean;
  /** 是否最小化 */
  isMinimized: boolean;
  /** 是否处于加载态 */
  loading: boolean;
  /** UI 层错误提示 */
  error?: string;
}

/**
 * Strategy Slice：渠道策略与坐席状态。
 */
export interface StrategyState {
  /** 允许的渠道列表（由 strategy.allowedChannels 约束） */
  allowedChannels: ChannelType[];
  /** 当前激活渠道 */
  activeChannel?: ChannelType;
  /** 坐席状态（用于 in_call 互斥策略） */
  agentStatus?: 'online' | 'offline' | 'in_call';
}

/**
 * Conversation Slice：消息流与会话状态。
 */
export interface ConversationState {
  /** 当前消息流（按时间排序） */
  messages: StandardMessage[];
}

/**
 * Context Slice：宿主上下文（客户画像、模板等）。
 */
export interface ContextState {
  /** 客户画像或业务上下文 */
  profile?: Record<string, unknown>;
  /** 模板列表（可注入 Composer） */
  templates?: Array<{ id: string; content: string }>;
}

/**
 * ChatStoreState：聚合 Slice 的单一 Store。
 */
export interface ChatStoreState {
  /** UI Slice */
  ui: UiState;
  /** Strategy Slice */
  strategy: StrategyState;
  /** Conversation Slice */
  conversation: ConversationState;
  /** Context Slice */
  context: ContextState;
  /** Store Actions */
  actions: {
    /** 更新 UI 状态 */
    setUi: (payload: Partial<UiState>) => void;
    /** 更新策略状态 */
    setStrategy: (payload: Partial<StrategyState>) => void;
    /** 追加消息（Optimistic UI） */
    appendMessage: (message: StandardMessage) => void;
    /** 更新上下文数据 */
    setContext: (payload: Partial<ContextState>) => void;
  };
}

/**
 * useChatStore：SDK 内部 Zustand Store（Singleton）。
 */
export const useChatStore = create<ChatStoreState>(((set) => ({
  ui: {
    isOpen: true,
    isMinimized: false,
    loading: false,
  },
  strategy: {
    allowedChannels: [],
  },
  conversation: {
    messages: [],
  },
  context: {},
  actions: {
    setUi: (payload: Partial<UiState>) =>
      set((state) => ({ ui: { ...state.ui, ...payload } })),
    setStrategy: (payload: Partial<StrategyState>) =>
      set((state) => ({ strategy: { ...state.strategy, ...payload } })),
    appendMessage: (message: StandardMessage) =>
      set((state) => ({
        conversation: {
          ...state.conversation,
          messages: [...state.conversation.messages, message],
        },
      })),
    setContext: (payload: Partial<ContextState>) =>
      set((state) => ({ context: { ...state.context, ...payload } })),
  },
})) as StateCreator<ChatStoreState>);
