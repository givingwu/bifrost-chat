# Architecture Baseline

> Last updated: 2026-02-28  
> Scope: `@feoe/bifrost-chat` JS SDK

This document is a quick reference for SDK architecture. For complete architecture, see `docs/final-architecture.md`.

## Core Concepts

### Conversation

SDK uniformly uses **Conversation** concept. Using Session naming in public APIs is strictly prohibited.

```typescript
// ✅ Correct
interface Conversation {}
useConversations()
conversationId

// ❌ Wrong
interface Session {}
useSessions()
sessionId
```

### Dependency Injection

SDK does not directly connect to backend APIs. All services are injected via `ServiceProvider`:

```tsx
import { ServiceProvider } from '@feoe/bifrost-chat';

<ServiceProvider services={{
  conversationService: myConversationService,
  messageService: myMessageService,
  templateService: myTemplateService,
}}>
  <App />
</ServiceProvider>
```

### State Boundary

| State Type | Management | Examples |
|---|---|---|
| Server State | React Query | Conversation list, message list, template list |
| Client State | Zustand | Input config, panel toggle, theme, language |

## Directory Structure

```
src/
├── components/     # UI components
│   ├── composer/   # Input area
│   ├── conversation/ # Conversation list
│   ├── messages/   # Message flow
│   ├── profile/    # Contact info
│   ├── template/   # Template panel
│   └── layout/     # Layout components
├── hooks/          # React Hooks
├── interfaces/     # Type definitions
├── providers/      # Provider components
├── services/       # Service interfaces
└── store/          # Zustand Store
```

## Public API

### Hooks

- `useConversations` - Query conversation list
- `useCreateConversation` - Create conversation
- `useMessages` - Query message list
- `useSendMessage` - Send message
- `useMarkAsRead` - Mark as read
- `useTemplates` - Query template list

### Providers

- `QueryProvider` - React Query config
- `ServiceProvider` - Service injection
- `ConfigProvider` - SDK config
- `I18nProvider` - Internationalization

### Components

- `DefaultChatLayout` - Default layout
- `MessageList` / `InfiniteMessageList` - Message list
- `Composer` series - Input components
- `Profile` - Contact info
- `TemplatePanel` - Template panel

## Error Types

```typescript
SDKError          // Base class
├── HTTPError     // HTTP error
├── ValidationError // Validation error
├── AuthorizationError // Authorization error
├── ConfigurationError // Configuration error
├── NotImplementedError // Not implemented
└── MapperError   // Mapper error
```

## Performance Optimization

- **Virtual Scroll**: `@tanstack/react-virtual`
- **Pagination**: React Query infinite query
- **Cache**: React Query query cache

## Internationalization

Currently supported:
- Chinese (zh-CN)
- English (en-US)

## Further Reading

- [Full Architecture](/en-US/guide/final-architecture)
- [Naming Conventions](/en-US/guide/naming-conventions)
- [Installation Guide](/en-US/guide/installation)