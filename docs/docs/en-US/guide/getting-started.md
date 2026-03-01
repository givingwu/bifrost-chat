# Getting Started

## Current Implementation (As-Is)

- Public terminology is unified as `Conversation` (`Session` is not allowed in
  public API naming).
- Integration model is dependency injection:
  - `ServiceProvider` for service implementations
  - `QueryProvider` for React Query
  - `ConfigProvider` for client-side Zustand initialization
  - `ChatContainer` + `DefaultChatLayout` for default rendering

## Target Architecture (To-Be)

- Template send/preview evolves into independent query/mutation flows.
- Channel strategy matrix continues to be standardized.

## Installation

```bash
pnpm add @feoe/bifrost-chat
```

## 1) Implement Service Interfaces

```tsx
import type {
  Conversation,
  IConversationService,
  IMessageService,
  ITemplateService,
  MessageSendResult,
  StandardMessage,
  Template,
} from '@feoe/bifrost-chat';

const conversationService: IConversationService = {
  async list() {
    const res = await fetch('/api/conversations');
    return (await res.json()) as Conversation[];
  },
  async get(conversationId) {
    const res = await fetch(`/api/conversations/${conversationId}`);
    return (await res.json()) as Conversation | null;
  },
  async create(params) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Conversation;
  },
  async query(params) {
    const res = await fetch('/api/conversations/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Conversation | null;
  },
};

const messageService: IMessageService = {
  async list(conversationId, params) {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as StandardMessage[];
  },
  async send(conversationId, params) {
    const res = await fetch(
      `/api/conversations/${conversationId}/messages/send`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return (await res.json()) as MessageSendResult;
  },
  async markAsRead(params) {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  subscribeToMessages(_callback) {
    return () => {};
  },
  subscribeToMessageStatus(_callback) {
    return () => {};
  },
  async sendAttachment() {
    throw new Error('Implement attachment upload/send in host application');
  },
  async sendAudio() {
    throw new Error('Implement audio upload/send in host application');
  },
};

const templateService: ITemplateService = {
  async list(params) {
    const res = await fetch('/api/templates/list', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Template[];
  },
  async send(params) {
    const res = await fetch('/api/templates/send', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as MessageSendResult;
  },
  async preview(templateId, variables) {
    const res = await fetch(`/api/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify(variables),
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.text();
  },
};
```

## 2) Compose Providers and Default Layout

```tsx
import {
  ChannelTypeEnum,
  ChatContainer,
  ConfigProvider,
  DefaultChatLayout,
  LanguageCodeEnum,
  QueryProvider,
  ServiceProvider,
} from '@feoe/bifrost-chat';

export function App() {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.EnUS },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
        composer: {
          enableDraft: true,
          enableAttachments: true,
          enableAudioInput: true,
          showEmojiButton: true,
        },
      }}
    >
      <QueryProvider>
        <ServiceProvider
          conversationService={conversationService}
          messageService={messageService}
          templateService={templateService}
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

## 3) Terminology Compatibility

- Public SDK naming uses `Conversation` / `conversationId`.
- Protocol docs may still contain historical `chatId` / `session` fields for
  compatibility context.

## Next

- [Installation](/en-US/guide/installation)
- [Architecture Baseline](/en-US/guide/architecture-baseline)
- [ACK Mechanism](/en-US/guide/ack-mechanism)
