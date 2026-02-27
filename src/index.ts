// Styles
import './styles/index.css';

// Components
export * from '@/components';
export type {
  DefaultChatLayoutRenderTopbar,
  DefaultChatLayoutRenderTopbarProps,
} from '@/components/layout/DefaultChatLayout';

// Hooks
// 会话相关 Hooks
export { useConversations } from '@/hooks/use-conversations.hook';
export { useCreateConversation } from '@/hooks/use-create-conversation.hook';
export { useInViewport } from '@/hooks/use-in-viewport.hook';
export { useMarkAsRead } from '@/hooks/use-mark-as-read.hook';
// 消息相关 Hooks
export { useMessages } from '@/hooks/use-messages.hook';
export { useSendMessage } from '@/hooks/use-send-message.hook';
// 模板相关 Hooks
export { useTemplates } from '@/hooks/use-templates.hook';

// Types
export * from '@/interfaces/agent.interface';
export * from '@/interfaces/attachment.interface';
export * from '@/interfaces/audio.interface';
export * from '@/interfaces/channel.interface';
export * from '@/interfaces/composer.interface';
export * from '@/interfaces/connection.interface';
export * from '@/interfaces/conversation.interface';
export * from '@/interfaces/error.interface';
export * from '@/interfaces/language.interface';
export * from '@/interfaces/message.interface';
export * from '@/interfaces/message-type-config.interface';
export * from '@/interfaces/network.interface';
export * from '@/interfaces/offline-message.interface';
export * from '@/interfaces/profile.interface';
export * from '@/interfaces/protocol.interface';
export * from '@/interfaces/sdk.interface';
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
export * from '@/services/conversation.service';
export * from '@/services/message.service';
export * from '@/services/message-builder.service';
export * from '@/services/message-cache-helper.service';
export * from '@/services/message-sync.service';
// Protocol Layer
export * from '@/services/protocol';
export * from '@/services/template.service';
export * from '@/services/websocket';

// Store
export * from '@/store';
// Utils
export * from '@/utils/class.util';
export * from '@/utils/sdk-cleanup.util';
export * from '@/utils/storage.util';
export * from '@/utils/time.util';
