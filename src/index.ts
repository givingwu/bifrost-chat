// 自动引入样式
import './styles/index.css';

// Components
export * from '@/components';

// Events
export * from '@/events/client-bus.event';

// Hooks
export { useComposerDraft } from '@/hooks/use-composer-draft.hook';
export { useComposerShortcuts } from '@/hooks/use-composer-shortcuts.hook';
// 会话相关 Hooks
export { useConversations } from '@/hooks/use-conversations.hook';
export { useCreateConversation } from '@/hooks/use-create-conversation.hook';
export { useMarkAsRead } from '@/hooks/use-mark-as-read.hook';
// 消息相关 Hooks
export { useMessages } from '@/hooks/use-messages.hook';
export { useSendMessage } from '@/hooks/use-send-message.hook';
// 模板相关 Hooks
export { useTemplates } from '@/hooks/use-templates.hook';

// Types
export * from '@/interfaces/agent.interface';
export * from '@/interfaces/channel.interface';
export * from '@/interfaces/connection.interface';
export * from '@/interfaces/conversation.interface';
export * from '@/interfaces/error.interface';
export * from '@/interfaces/language.interface';
export * from '@/interfaces/message.interface';
export * from '@/interfaces/network.interface';
export * from '@/interfaces/profile.interface';
export * from '@/interfaces/sdk.interface';
export * from '@/interfaces/template.interface';
export * from '@/interfaces/theme.interface';

// Locales
export { default as enUSMessages } from '@/locales/en-US.json';
export { default as zhCNMessages } from '@/locales/zh-CN.json';
export { ConfigProvider, useConfig } from '@/providers/config.provider';
// Providers
// I18n Provider
export { I18nProvider } from '@/providers/I18n.provider';
// React Query Provider
export {
  createQueryClient,
  queryKeys,
  ReactQueryProvider,
} from '@/providers/query.provider';
// Service Provider (依赖注入)
export {
  createNotImplementedServices,
  ServiceProvider,
  useServices,
} from '@/providers/service.provider';

// Service Interfaces
export * from '@/services/conversation.service';
export * from '@/services/message.service';
export * from '@/services/template.service';

// Store
export * from '@/store';

// Utils
export { cn } from '@/utils/class.util';
export { MessageBuilder } from '@/utils/message-builder.util';
export { formatTimestamp } from '@/utils/time.util';
