# @feoe/bifrost-chat

[![npm version](https://badge.fury.io/js/%40feoe%2Fbifrost-chat.svg)](https://www.npmjs.com/package/@feoe/bifrost-chat)
[![Storybook](https://github.com/givingwu/bifrost-chat/actions/workflows/storybook.yml/badge.svg)](https://github.com/givingwu/bifrost-chat/actions/workflows/storybook.yml)
[![GitHub Pages](https://img.shields.io/badge/Storybook-GitHub_Pages-4285F4?logo=githubpages)](https://givingwu.github.io/bifrost-chat/)

> [中文文档](README.zh-CN.md) | Omni-channel chat JS SDK with React & Tailwind CSS, dependency injection architecture, React Query + Zustand state management.

---

## Features

- Unified Conversation semantics (Session deprecated in public API)
- Interface abstraction + dependency injection (ServiceProvider)
- React Query (server state) + Zustand (client state)
- Default layout components + composable components
- Built-in channel enums & icon components: SMS, WhatsApp, WaAgent, Email, Viber, RCS
- Full TypeScript with generic service parameters
- Built-in i18n & theming
- Template preview, template fill/send, message type config by channel
- Packet `channelAccount` / `senderType` display for sender number suffix & Chatbot badge
- RCS click callback status display (`clicked`)
- Natural day-based date separators in message stream
- Host network injection, offline failed message injection & retry hooks

## Tech Stack

- TypeScript
- React (dev: React 19, peer: `react >=16.9.0`)
- Tailwind CSS 4
- @tanstack/react-query
- @tanstack/react-virtual
- Zustand
- Rslib
- Vitest
- Biome

## Installation

```bash
pnpm add @feoe/bifrost-chat
# or
npm install @feoe/bifrost-chat
# or
yarn add @feoe/bifrost-chat
```

## Quick Start

### 1) Implement Service Interfaces

```tsx
import {
  type Conversation,
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  type MarkAsReadMeta,
  type MarkAsReadResult,
  type MessageReceivedEvent,
  type MessageStatusUpdatedEvent,
  type MessageSendResult,
  type SendAttachmentResult,
  type SendAudioResult,
  type StandardMessage,
  type Template,
  type TemplatePreviewParams,
  type TemplatePreviewResult,
} from '@feoe/bifrost-chat';

class MyConversationService implements IConversationService {
  async list() {
    const response = await fetch('/api/conversations');
    return (await response.json()) as Conversation[];
  }

  async get(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}`);
    return (await response.json()) as Conversation | null;
  }

  async create(params: unknown) {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Conversation;
  }

  async query(params: unknown) {
    const response = await fetch('/api/conversations/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Conversation | null;
  }
}

class MyMessageService implements IMessageService {
  async list(conversationId: string, params: unknown) {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return (await response.json()) as StandardMessage[];
  }

  async send(conversationId: string, params: unknown) {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return (await response.json()) as MessageSendResult;
  }

  async markAsRead(
    params: unknown,
    _meta?: MarkAsReadMeta,
  ): Promise<undefined | MarkAsReadResult> {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return undefined;
  }

  subscribeToMessages(_callback: (event: MessageReceivedEvent) => void) {
    return () => {};
  }

  subscribeToMessageStatus(
    _callback: (update: MessageStatusUpdatedEvent) => void,
  ) {
    return () => {};
  }

  async sendAttachment(params: unknown): Promise<SendAttachmentResult> {
    const response = await fetch('/api/messages/send-attachment', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as SendAttachmentResult;
  }

  async sendAudio(params: unknown): Promise<SendAudioResult> {
    const response = await fetch('/api/messages/send-audio', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as SendAudioResult;
  }
}

class MyTemplateService implements ITemplateService {
  async list(params: unknown) {
    const response = await fetch('/api/templates/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Template[];
  }

  async preview(params: TemplatePreviewParams) {
    const response = await fetch('/api/templates/render', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as TemplatePreviewResult;
  }
}
```

### 2) Assemble Providers & Default Layout

```tsx
import {
  ChannelTypeEnum,
  ChatContainer,
  ConfigProvider,
  DefaultChatLayout,
  type INetworkService,
  LanguageCodeEnum,
  NetworkQualityEnum,
  NetworkReachabilityEnum,
  NetworkStatusEnum,
  QueryProvider,
  ServiceProvider,
} from '@feoe/bifrost-chat';

const conversationService = new MyConversationService();
const messageService = new MyMessageService();
const templateService = new MyTemplateService();
const networkService: INetworkService = {
  getSnapshot: () => ({
    status: NetworkStatusEnum.Connected,
    reachability: NetworkReachabilityEnum.Online,
    quality: NetworkQualityEnum.Good,
    enableStatusIndicator: true,
  }),
  subscribe: () => () => {},
};

export function App() {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.ZhCN },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
        composer: {
          customMessageMaxLength: 500,
          ignoreMaxLengthForTemplateMessages: true,
        },
      }}
    >
      <QueryProvider>
        <ServiceProvider
          conversationService={conversationService}
          messageService={messageService}
          templateService={templateService}
          networkService={networkService}
        >
          <ChatContainer>
            <DefaultChatLayout />
          </ChatContainer>
        </ServiceProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}
```

#### Mobile Layout

`MobileLayout` provides lightweight mobile structure: Header + MessageList + Footer.

```tsx
import { MobileLayout } from '@feoe/bifrost-chat';

export function MobileApp() {
  return (
    <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
      <QueryProvider>
        <ServiceProvider
          conversationService={conversationService}
          messageService={messageService}
          templateService={templateService}
        >
          <ChatContainer>
            <MobileLayout onClose={() => closePanel()} />
          </ChatContainer>
        </ServiceProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}
```

#### Template-Only Input Mode

```tsx
<ConfigProvider
  config={{
    composer: {
      inputMode: 'template-only',
      placeholder: '请选择模板内容',
      templateMode: 'edit',
      allowTemplateEdit: false,
    },
  }}
>
  {/* ... */}
</ConfigProvider>
```

### 3) Host Network Integration

- `ServiceProvider` supports optional `networkService` injection
- SDK syncs Host network facts to Zustand `network` & React Query `onlineManager`
- Without injection: defaults to `status: Unknown`, `reachability: Unknown`, no indicator
- Offline sync only depends on `reachability === Online`
- Failed messages only enter offline queue when `errorType === Network` or `retryable === true`

### 4) Composer Draft & Offline Queue

- `composer.customMessageMaxLength`: custom message character limit
- `composer.ignoreMaxLengthForTemplateMessages`: templates ignore limit (default `true`)
- Drafts cached by `conversationId + channel`; degrades to `channel`-level when no conversationId
- Old conversation-level draft keys migrate on first read
- `localStorage` quota exceeded → fallback compression: keep only `content`, `messageType`, `templateCode`, sanitized `templateParams`, LRU eviction
- `clearDraftOnSend` only clears on success terminal state
- Network failures / retryable failures → offline queue; business/auth/validation failures not queued

## Public API

### Components

See `src/components/index.ts` for authoritative exports.

Layout: `ChatContainer`, `ChatLayout`, `DefaultChatLayout`, `MobileLayout`

Composer: `Composer`, `ComposerToolbar`, `ComposerInput`, `ComposerActions`, `ComposerAttachments`, `AttachmentPreview`, `ComposerVoice`, `EmojiPicker`, `MentionPicker`

Messages: `InfiniteMessageList`, `MessageList`, `MessageRendererFactory`, `MessageContentRenderer`, `MessageBubble`, `TextMessage`, `ImageMessage`, `AudioMessage`, `VideoMessage`, `FileMessage`, `LocationMessage`, `RichMediaMessage`, `WhatsAppMessage`, `UnsupportedMessage`, `StatusIndicator`

Channel icons: `ChannelIcon`, `SmsChannelIcon`, `WhatsAppChannelIcon`, `WaAgentChannelIcon`, `EmailChannelIcon`, `ViberChannelIcon`, `RcsChannelIcon`, `CHANNEL_ICON_COMPONENTS`, `CHANNEL_ICON_SIZE_PX`, `CHANNEL_BRAND_COLOR`

```tsx
import {
  ChannelIcon,
  ChannelTypeEnum,
  WhatsAppChannelIcon,
} from '@feoe/bifrost-chat';

<ChannelIcon channel={ChannelTypeEnum.RCS} size="md" title="RCS" />;
<WhatsAppChannelIcon size={20} title="WhatsApp" />;
```

### Hooks

`useConversations`, `useCreateConversation`, `useConversationDetail`, `useConversationMetadata`, `useActiveConversationMetadata`, `useSetActiveConversation`, `ActivateConversationScenario`, `useChannelIcon`, `useChannelLabel`, `useChannelUnread`, `useConversationUnread`, `useInViewport`, `useMarkAsRead`, `useMessageStatusSync`, `useMessageTypeConfig`, `useMessages`, `useOfflineSync`, `useRetryMessage`, `useDeleteFailedMessage`, `useSendMessage`, `useTemplatePreview`, `useTemplateSelect`, `useTemplates`, `useTotalUnread`, `useUnreadCount`, `useUnreadSync`, `useAudioRecorder`, `useComposerDraft`, `useComposerFocus`, `useComposerLogic`

### Providers

`ConfigProvider`, `useConfig`
`I18nProvider`, `useTranslation`
`QueryProvider`, `createQueryClient`, `clearQueryCache`, `defaultQueryClient`, `queryKeys`
`ServiceProvider`, `useServices`, `createNotImplementedServices`

### Types & Service Interfaces

Service interfaces: `IConversationService`, `IMessageService`, `ITemplateService`, `INetworkService`

Core types: `Conversation`, `StandardMessage`, `Template`, `IConfigSettings`, `SDKConfig`, `MessageTypeConfig`, `NetworkState`, `OfflineMessage`, `OfflineQueueConfig`, `WebSocketConfig`

Protocol/real-time exports: `PacketConverter`, `PacketValidator`, `AckHandler`, `HeartbeatManager`, `WebSocketManager`, `WebSocketEventTypeEnum`, `MessageBuilder`

Error classes defined in `src/errors/` are not exported as public API.

### Store & Utilities

Store: `useChatStore`, `configureChatStore`, `resetChatStore`, `useStrategy`, `useNetwork`, `useTheme`, `useLanguage`, `useConversation`, `useActiveConversationId`, `useProfile`, `useComposerConfig`, `useActions`

Draft store: `useComposerDraftStore`, `buildComposerDraftKey`, `resetComposerDraftStore`

Utils: `cn`, `formatTimestamp`, `formatDuration`, `createStorageHelper`, `clearSDK`, `ConversationCacheHelper`, `MessageBuilder`

Language packs: `enUSMessages`, `zhCNMessages`

## Internal Capabilities (Not Exported)

`TemplatePicker`, `Tooltip`, `ChatSDK`, `MessageCacheHelper`, `MessageSyncService`, `OfflineMessageQueueService`, `useRetryOfflineMessage`, `useWebSocket`, `createWebSocketMessageHandler`, error classes

Migration notes:

- `clearSDK()` restored for compatibility
- Protocol/real-time exports restored: `PacketConverter`, `WebSocketManager`, `WebSocketEventTypeEnum`, `MessageBuilder`
- New code should use `resetChatStore()` + `clearQueryCache(queryClient)`, only pass `clearStorage: true` when cleaning persisted state
- `clearStorage: true` clears old & new draft keys, and offline queue if `offlineMessageQueue` injected
- `ServiceProvider` accepts `offlineMessageQueue` injection; built-in `OfflineMessageQueueService` not publicly exported

## Styles

Base styles auto-injected. Import optionally:

```tsx
import '@feoe/bifrost-chat/styles';
import '@feoe/bifrost-chat/styles/theme';
```

## Development

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run test
pnpm run check
pnpm run format
pnpm run storybook
```

### Static Storybook deployment (As-Is)

```bash
pnpm run build:storybook
pnpm run check:storybook
```

The build uses `rsbuildFinal` with `output.assetPrefix: './'` so preview
scripts, styles and lazy chunks load relative to `iframe.html`. Upload
`storybook-static/` as-is; no `BASE_PATH` or injected `<base>` tag is needed.
The Pages workflow checks entrypoint asset URLs and files at the root, at
`/bifrost-chat/` and at a nested path before uploading the deployment artifact.
This check validates asset paths, not browser rendering.

## Feedback

- Issues: See `bugs.url` in package.json
- Architecture conflicts: Refer to `design/final-architecture.md`

## License

[MIT](LICENSE)
