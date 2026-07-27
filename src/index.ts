// Styles
import './styles/index.css';

// Components
export * from '@/components';
export type {
  DefaultChatLayoutConversationHeaderProps,
  DefaultChatLayoutRenderTopbar,
  DefaultChatLayoutRenderTopbarProps,
} from '@/components/layout/DefaultChatLayout';
export type { MobileChatLayoutProps } from '@/components/layout/MobileChatLayout';

// Hooks - 会话相关 Hooks
export * from '@/hooks';

// Types
export * from '@/interfaces/agent.interface';
export * from '@/interfaces/attachment.interface';
export * from '@/interfaces/audio.interface';
export * from '@/interfaces/channel.interface';
export * from '@/interfaces/composer.interface';
export * from '@/interfaces/connection.interface';
export * from '@/interfaces/conversation.interface';
export * from '@/interfaces/language.interface';
export * from '@/interfaces/message.interface';
export * from '@/interfaces/message-type-config.interface';
export * from '@/interfaces/network.interface';
export * from '@/interfaces/offline-message.interface';
export * from '@/interfaces/profile.interface';
export * from '@/interfaces/protocol.interface';
export * from '@/interfaces/template.interface';
export * from '@/interfaces/theme.interface';
export * from '@/interfaces/websocket.interface';

// Locales
export { default as enUSMessages } from '@/locales/en-US.json';
export { default as zhCNMessages } from '@/locales/zh-CN.json';

// Providers
// Config Provider
export * from '@/providers/config.provider';
// I18n Provider
export * from '@/providers/I18n.provider';
// React Query Provider
export * from '@/providers/query.provider';
// Service Provider (依赖注入)
export * from '@/providers/service.provider';

// Service Interfaces
export * from '@/services/cache/conversation-cache-helper.service';
export * from '@/services/core/conversation.service';
export * from '@/services/core/message.service';
export * from '@/services/core/network.service';
export * from '@/services/core/template.service';
export * from '@/services/messaging/message-builder.service';
export * from '@/services/protocol';
export * from '@/services/websocket';

// Store
export * from '@/store';
// Utils
export * from '@/utils/class.util';
export * from '@/utils/sdk-cleanup.util';
export * from '@/utils/storage.util';
export * from '@/utils/time.util';
