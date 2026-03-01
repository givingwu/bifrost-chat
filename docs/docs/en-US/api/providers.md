# Providers API Reference

## Current Implementation (As-Is)

The following Providers are publicly exported from `@feoe/bifrost-chat`.

## Target Architecture (To-Be)

- Enhanced DI diagnostics (injection missing hints, method not implemented hints).

---

## ConfigProvider

SDK configuration Provider, initializes Zustand client state.

```tsx
import { ConfigProvider, ChannelTypeEnum, LanguageCodeEnum } from '@feoe/bifrost-chat';

<ConfigProvider
  config={{
    // Language config
    language: { code: LanguageCodeEnum.EnUS },
    
    // Channel strategy
    strategy: {
      allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
      activeChannel: ChannelTypeEnum.WhatsApp,
    },
    
    // Composer config
    composer: {
      enableDraft: true,        // Enable draft
      enableAttachments: true,  // Enable attachments
      enableAudioInput: true,   // Enable audio input
      showEmojiButton: true,    // Show emoji button
    },
  }}
>
  <App />
</ConfigProvider>
```

**Config Options**

| Field | Type | Description |
|---|---|---|
| `language` | `{ code: LanguageCodeEnum }` | Language config |
| `strategy` | `StrategyConfig` | Channel strategy config |
| `composer` | `ComposerConfig` | Composer config |

---

## QueryProvider

React Query configuration Provider.

```tsx
import { QueryProvider } from '@feoe/bifrost-chat';

<QueryProvider>
  <App />
</QueryProvider>
```

**Features**

- Configures React Query default options
- Provides QueryClient instance

---

## ServiceProvider

Service dependency injection Provider, injects business service implementations.

```tsx
import { ServiceProvider } from '@feoe/bifrost-chat';
import type { IConversationService, IMessageService, ITemplateService } from '@feoe/bifrost-chat';

<ServiceProvider
  conversationService={myConversationService}
  messageService={myMessageService}
  templateService={myTemplateService}
>
  <App />
</ServiceProvider>
```

**Service Interfaces**

| Service | Interface | Description |
|---|---|---|
| `conversationService` | `IConversationService` | Conversation service |
| `messageService` | `IMessageService` | Message service |
| `templateService` | `ITemplateService` | Template service |

### useServices

Get injected service instances.

```tsx
import { useServices } from '@feoe/bifrost-chat';

function MyComponent() {
  const { conversationService, messageService, templateService } = useServices();
  
  // Use services...
}
```

---

## I18nProvider

Internationalization Provider, supports custom language packs.

```tsx
import { I18nProvider, enUSMessages } from '@feoe/bifrost-chat';

<I18nProvider messages={enUSMessages}>
  <App />
</I18nProvider>
```

**Built-in Language Packs**

- `zhCNMessages` - Chinese
- `enUSMessages` - English

---

## Combined Usage

Complete Provider nesting order:

```tsx
import {
  ConfigProvider,
  QueryProvider,
  ServiceProvider,
  I18nProvider,
  ChatContainer,
  DefaultChatLayout,
  ChannelTypeEnum,
  LanguageCodeEnum,
  enUSMessages,
} from '@feoe/bifrost-chat';

export function App() {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.EnUS },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
        composer: {
          enableDraft: true,
          enableAttachments: true,
          enableAudioInput: false,
          showEmojiButton: true,
        },
      }}
    >
      <QueryProvider>
        <I18nProvider messages={enUSMessages}>
          <ServiceProvider
            conversationService={conversationService}
            messageService={messageService}
            templateService={templateService}
          >
            <ChatContainer>
              <DefaultChatLayout />
            </ChatContainer>
          </ServiceProvider>
        </I18nProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}