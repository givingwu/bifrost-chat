import type { StateCreator } from 'zustand';
import { create } from 'zustand';
import type { LanguageState } from '@/interfaces/language.interface';
import type { NetworkState } from '@/interfaces/network.interface';
import type { ThemeState } from '@/interfaces/theme.interface';
import { loadMessagesSync } from '@/utils/i18n.util';
import type { ComposerSlice, ComposerState } from './slices/composer.slice';
import { createComposerSlice } from './slices/composer.slice';
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

// 导出状态类型，供外部使用
export type { StrategyState, ConversationState, ProfileState, ComposerState };

/**
 * Chat Store 状态类型
 * 组合所有 Slice 的状态类型
 */
export type ChatStoreState = StrategySlice &
  NetworkSlice &
  ThemeSlice &
  LanguageSlice &
  ConversationSlice &
  ProfileSlice &
  ComposerSlice;

export type ChatStoreConfigState = {
  activeConversationId: ConversationState['activeConversationId'];
  strategy: StrategyState;
  network: NetworkState;
  theme: ThemeState;
  language: LanguageState;
  profile: ProfileState;
  composer: ComposerState;
};

export type ChatStoreInitialState = Partial<{
  [K in keyof ChatStoreConfigState]: Partial<ChatStoreConfigState[K]>;
}>;

export type ChatStoreActions = ChatStoreState['actions'];

/**
 * useChatStore：SDK 内部 Zustand Store（Singleton）
 *
 * 这个 Store 管理整个聊天应用的状态，包括：
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
 * actions.setActiveChannel(ChannelTypeEnum.WhatsApp);
 */
const createDefaultState: StateCreator<
  ChatStoreState,
  [],
  [],
  ChatStoreState
> = (...args) => {
  const strategySlice = createStrategySlice(...args);
  const networkSlice = createNetworkSlice(...args);
  const themeSlice = createThemeSlice(...args);
  const languageSlice = createLanguageSlice(...args);
  const conversationSlice = createConversationSlice(...args);
  const profileSlice = createProfileSlice(...args);
  const composerConfigSlice = createComposerSlice(...args);

  return {
    ...strategySlice,
    ...networkSlice,
    ...themeSlice,
    ...languageSlice,
    ...conversationSlice,
    ...profileSlice,
    ...composerConfigSlice,
    actions: {
      ...strategySlice.actions,
      ...networkSlice.actions,
      ...themeSlice.actions,
      ...languageSlice.actions,
      ...conversationSlice.actions,
      ...profileSlice.actions,
      ...composerConfigSlice.actions,
    },
  };
};

const mergeInitialState = (
  baseState: ChatStoreState,
  initialState?: ChatStoreInitialState,
): ChatStoreState => {
  if (!initialState) {
    return baseState;
  }

  return {
    ...baseState,
    strategy: initialState.strategy
      ? { ...baseState.strategy, ...initialState.strategy }
      : baseState.strategy,
    network: initialState.network
      ? { ...baseState.network, ...initialState.network }
      : baseState.network,
    theme: initialState.theme
      ? { ...baseState.theme, ...initialState.theme }
      : baseState.theme,
    language: initialState.language
      ? {
          ...baseState.language,
          ...initialState.language,
          // 确保 messages 始终存在，如果 code 变化了则重新加载 messages
          messages:
            initialState.language.code &&
            initialState.language.code !== baseState.language.code
              ? loadMessagesSync(initialState.language.code)
              : baseState.language.messages,
        }
      : baseState.language,
    profile: initialState.profile
      ? { ...baseState.profile, ...initialState.profile }
      : baseState.profile,
    conversation: initialState.activeConversationId
      ? {
          ...baseState.conversation,
          activeConversationId: initialState.activeConversationId,
        }
      : baseState.conversation,
    composer: initialState.composer
      ? { ...baseState.composer, ...initialState.composer }
      : baseState.composer,
  };
};

export const useChatStore = create<ChatStoreState>()((...args) => {
  return createDefaultState(...args);
});

/**
 * 配置全局单例 Chat Store。
 * - 设计为初始化用途；建议在应用启动时调用一次。
 */
export const configureChatStore = (initialState?: ChatStoreInitialState) => {
  if (!initialState) {
    return;
  }

  useChatStore.setState((state) => mergeInitialState(state, initialState));
};

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
 * Composer 配置状态选择器
 * 返回 Composer 功能配置（附件、语音等）
 *
 * @example
 * const { enableAttachments, enableVoiceInput, maxAttachments } = useComposerConfig();
 */
export const useComposerConfig = () => useChatStore((state) => state.composer);

/**
 * Actions 选择器
 * 返回所有可用的 actions
 *
 * @example
 * const actions = useActions();
 * actions.setActiveChannel(ChannelTypeEnum.WhatsApp);
 */
export const useActions = () => useChatStore((state) => state.actions);
