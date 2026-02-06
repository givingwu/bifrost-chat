import { create } from 'zustand';
import type {
  ConversationSlice,
  ConversationState,
} from './slices/conversation.slice';
import { createConversationSlice } from './slices/conversation.slice';
import type { LanguageSlice } from './slices/language.slice';
import { createLanguageSlice } from './slices/language.slice';
import type { NetworkSlice } from './slices/network.slice';
import { createNetworkSlice } from './slices/network.slice';
import type { ProfileSlice, ProfileState } from './slices/profile.slice';
import { createProfileSlice } from './slices/profile.slice';
import type { StrategySlice, StrategyState } from './slices/strategy.slice';
import { createStrategySlice } from './slices/strategy.slice';
import type { ThemeSlice } from './slices/theme.slice';
import { createThemeSlice } from './slices/theme.slice';
import type { UiSlice, UiState } from './slices/ui.slice';
import { createUiSlice } from './slices/ui.slice';

// 导出状态类型，供外部使用
export type { UiState, StrategyState, ConversationState, ProfileState };

/**
 * Chat Store 状态类型
 * 组合所有 Slice 的状态类型
 */
export type ChatStoreState = UiSlice &
  StrategySlice &
  NetworkSlice &
  ThemeSlice &
  LanguageSlice &
  ConversationSlice &
  ProfileSlice;

/**
 * Config 状态类型（与 ChatStoreState 保持一致，移除 actions）
 */
export type ChatStoreConfigState = Omit<
  ChatStoreState,
  'actions' | 'conversation'
>;

/**
 * Store 初始化配置类型
 */
export type ChatStoreInitialState = Partial<ChatStoreConfigState>;

/**
 * Store Actions 类型
 * 提取所有 actions，提供类型安全的 actions 访问
 */
export type ChatStoreActions = ChatStoreState['actions'];

/**
 * useChatStore：SDK 内部 Zustand Store（Singleton）
 *
 * 这个 Store 管理整个聊天应用的状态，包括：
 * - UI 状态（打开、最小化、加载等）
 * - 策略状态（允许的渠道、当前渠道、坐席状态等）
 * - 网络状态（连接状态、质量等）
 * - 主题状态（模式、系统偏好等）
 * - 语言状态（当前语言等）
 * - 会话状态（当前激活的会话 ID 等）
 * - 客户画像状态（客户信息等）
 *
 * @example
 * // 获取整个状态
 * const state = useChatStore();
 *
 * @example
 * // 使用选择器获取特定状态
 * const activeConversationId = useChatStore(state => state.conversation.activeConversationId);
 *
 * @example
 * // 获取 actions
 * const actions = useChatStore(state => state.actions);
 * actions.setUi({ isOpen: true });
 */
export const useChatStore = create<ChatStoreState>()((...args) => ({
  // 创建所有 slice 并合并它们的状态和 actions
  ...(() => {
    // 创建各个 slice
    const uiSlice = createUiSlice(...args);
    const strategySlice = createStrategySlice(...args);
    const networkSlice = createNetworkSlice(...args);
    const themeSlice = createThemeSlice(...args);
    const languageSlice = createLanguageSlice(...args);
    const conversationSlice = createConversationSlice(...args);
    const profileSlice = createProfileSlice(...args);

    // 合并所有 slice 的状态
    return {
      ...uiSlice,
      ...strategySlice,
      ...networkSlice,
      ...themeSlice,
      ...languageSlice,
      ...conversationSlice,
      ...profileSlice,
      // 合并所有 actions
      actions: {
        ...uiSlice.actions,
        ...strategySlice.actions,
        ...networkSlice.actions,
        ...themeSlice.actions,
        ...languageSlice.actions,
        ...conversationSlice.actions,
        ...profileSlice.actions,
      },
    };
  })(),
}));

/**
 * UI 状态选择器
 * 返回 UI 相关的状态（打开、最小化、加载等）
 *
 * @example
 * const { isOpen, isMinimized, loading } = useUI();
 */
export const useUI = () => useChatStore((state) => state.ui);

/**
 * Strategy 状态选择器
 * 返回策略相关的状态（允许的渠道、当前渠道、坐席状态等）
 *
 * @example
 * const { allowedChannels, activeChannel, agentStatus } = useStrategy();
 */
export const useStrategy = () => useChatStore((state) => state.strategy);

/**
 * Network 状态选择器
 * 返回网络相关的状态（连接状态、质量等）
 *
 * @example
 * const { status, quality } = useNetwork();
 */
export const useNetwork = () => useChatStore((state) => state.network);

/**
 * Theme 状态选择器
 * 返回主题相关的状态（模式、系统偏好等）
 *
 * @example
 * const { mode, systemPrefersDark } = useTheme();
 */
export const useTheme = () => useChatStore((state) => state.theme);

/**
 * Language 状态选择器
 * 返回语言相关的状态（当前语言等）
 *
 * @example
 * const { code } = useLanguage();
 */
export const useLanguage = () => useChatStore((state) => state.language);

/**
 * Conversation 状态选择器
 * 返回会话相关的状态（当前激活的会话 ID 等）
 *
 * @example
 * const { activeConversationId } = useConversation();
 */
export const useConversation = () =>
  useChatStore((state) => state.conversation);

/**
 * Profile 状态选择器
 * 返回客户画像相关的状态（客户信息等）
 *
 * @example
 * const { profile } = useProfile();
 */
export const useProfile = () => useChatStore((state) => state.profile);

/**
 * Actions 选择器
 * 返回所有可用的 actions
 *
 * @example
 * const actions = useActions();
 * actions.setUi({ isOpen: true });
 * actions.setActiveChannel(ChannelTypeEnum.WhatsApp);
 */
export const useActions = () => useChatStore((state) => state.actions);
