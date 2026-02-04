// 自动引入样式
import './styles/index.css';

// Components
export * from './components';

// Events
export { ClientBus } from './events/client-bus.event';

// Hooks
export { useComposerDraft } from './hooks/composer-draft.hook';
export { useComposerShortcuts } from './hooks/composer-shortcuts.hook';

// Types
export { AgentStatusEnum } from './interfaces/agent.interface';
export {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from './interfaces/channel.interface';
export type { Conversation } from './interfaces/conversation.interface';
export {
  AvailableLanguageCodes,
  LanguageCodeEnum,
  LanguageState,
} from './interfaces/language.interface';
export type {
  MessageContent,
  MessageDirectionEnum,
  MessageParticipant,
  MessageStatusEnum,
  MessageTypeEnum,
  SendMessageOptions,
  StandardMessage,
} from './interfaces/message.interface';
export { NetworkStatusEnum } from './interfaces/network.interface';
export type {
  ProfileData,
  ProfileTemplate,
} from './interfaces/profile.interface';
export type {
  ChatSDK,
  SDKAction,
  SDKContext,
  SDKEvent,
} from './interfaces/sdk.interface';
export type {
  ThemeModeEnum,
  ThemeState,
} from './interfaces/theme.interface';

// Locales
export { default as enUSMessages } from './locales/en-US.json';
export { default as zhCNMessages } from './locales/zh-CN.json';

// Providers
export { I18nProvider, useTranslation } from './providers/I18n.provider';

// Store
export type { ChatStoreState } from './store';
export {
  useActions,
  useChatStore,
  useConversation,
  useLanguage,
  useNetwork,
  useProfile,
  useStrategy,
  useTheme,
  useUI,
} from './store';

// Utils
export { cn } from './utils/class.util';
export { MessageBuilder } from './utils/message-builder.util';
export { formatTimestamp } from './utils/time.util';
