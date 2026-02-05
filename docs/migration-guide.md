# 响应式架构迁移指南

本文档介绍如何从旧的状态管理方式迁移到新的响应式架构（React Query + Zustand）。

## 概述

### 架构变更

**旧架构**：
- 所有状态（服务端 + 客户端）都存储在 Zustand Store 中
- 手动管理数据获取、缓存、更新

**新架构**：
- **React Query** 管理服务端状态（会话列表、消息列表、模板列表）
- **Zustand** 仅管理客户端状态（UI 状态、主题、语言、activeConversationId）
- 自动缓存、重新获取、乐观更新

### 优势

1. **自动缓存**：React Query 自动缓存服务端数据
2. **自动重新获取**：窗口焦点、网络重连时自动刷新数据
3. **乐观更新**：发送消息时立即更新 UI，失败时自动回滚
4. **代码量减少 80%**：无需手动管理状态和副作用
5. **更好的开发者体验**：声明式编程，易于调试

## 迁移步骤

### 步骤 1：安装依赖

```bash
pnpm install @tanstack/react-query
```

### 步骤 2：实现服务接口

创建服务实现类，实现 SDK 定义的接口：

```tsx
// services/conversation.service.ts
import type { IConversationService } from '@feoe/bifrost-chat';
import type { Conversation } from '@feoe/bifrost-chat';

export class MyConversationService implements IConversationService {
  async list() {
    const response = await fetch('/api/conversations');
    const data = await response.json();
    return data; // 返回 Conversation[]
  }

  async get(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}`);
    return response.json();
  }

  async create(params) {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async query(params) {
    // 实现查询逻辑
    return null;
  }
}
```

```tsx
// services/message.service.ts
import type { IMessageService } from '@feoe/bifrost-chat';

export class MyMessageService implements IMessageService {
  async list(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    const data = await response.json();
    return data.messages; // 返回 StandardMessage[]
  }

  async send(conversationId: string, params) {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async markAsRead(params) {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  subscribeToMessages(callback) {
    // 可选：实现 WebSocket 订阅
    return () => {};
  }

  subscribeToMessageStatus(callback) {
    // 可选：实现状态订阅
    return () => {};
  }
}
```

### 步骤 3：包装应用

使用 `ReactQueryProvider` 和 `ServiceProvider` 包装应用：

```tsx
import {
  ReactQueryProvider,
  ServiceProvider,
  ChatContainer,
  DefaultChatLayoutContainer,
} from '@feoe/bifrost-chat';
import { MyConversationService } from './services/conversation.service';
import { MyMessageService } from './services/message.service';

function App() {
  return (
    <ReactQueryProvider>
      <ServiceProvider
        conversationService={new MyConversationService()}
        messageService={new MyMessageService()}
        templateService={/* 实现模板服务 */ null}
      >
        <ChatContainer locale="zh-CN">
          <DefaultChatLayoutContainer />
        </ChatContainer>
      </ServiceProvider>
    </ReactQueryProvider>
  );
}
```

### 步骤 4：使用容器组件

使用新的容器组件替代旧组件：

| 旧组件 | 新组件 |
|--------|--------|
| `ConversationList` | `ConversationListContainer` |
| `ChatMessageList` | `ChatMessageListContainer` |
| `ComposerToolbar` | `ComposerToolbarContainer` |
| `DefaultChatLayout` | `DefaultChatLayoutContainer` |

```tsx
// 旧代码
import { ConversationList, ChatMessageList } from '@feoe/bifrost-chat';

// 新代码
import {
  ConversationListContainer,
  ChatMessageListContainer,
} from '@feoe/bifrost-chat';
```

### 步骤 5：使用 React Query Hooks

使用新的 Hooks 替代 Zustand Store：

| 旧方式 | 新方式 |
|--------|--------|
| `useChatStore((state) => state.conversations)` | `useConversations()` |
| `useChatStore((state) => state.messages)` | `useMessages(conversationId)` |
| `useActions().sendMessage()` | `useSendMessage()` |

```tsx
// 旧代码
const { conversations, sendMessage } = useChatStore();
const messages = useConversation((state) => state.messages);

// 新代码
const { data: conversations } = useConversations();
const { data: messages } = useMessages(conversationId);
const { mutate: sendMessage } = useSendMessage();
```

### 步骤 6：更新状态访问

Zustand Store 现在只包含客户端状态：

```tsx
// ✅ 仍然可用（客户端状态）
const { ui, theme, language, strategy, network } = useChatStore();
const activeConversationId = useConversation((state) => state.activeConversationId);

// ❌ 不再可用（服务端状态）
const { conversations, messages } = useChatStore();
```

### 步骤 7：集成 WebSocket（可选）

如果需要实时通信，集成 WebSocket：

```tsx
import { useWebSocket } from '@feoe/bifrost-chat';
import { createWebSocketMessageHandler } from '@feoe/bifrost-chat';
import { useQueryClient } from '@tanstack/react-query';

function ChatApp() {
  const queryClient = useQueryClient();

  useWebSocket({
    url: 'wss://api.example.com/ws',
    token: 'your-auth-token',
    autoConnect: true,
    onMessage: createWebSocketMessageHandler(queryClient),
  });

  return <ChatContainer>...</ChatContainer>;
}
```

## 常见问题

### Q: 如何处理不同的 API 参数结构？

A: 使用泛型参数：

```tsx
class MyConversationService implements IConversationService<MyListParams, MyCreateParams> {
  async list(params?: MyListParams) {
    // 使用自定义参数
  }
  
  async create(params: MyCreateParams) {
    // 使用自定义参数
  }
}
```

### Q: 如何自定义缓存时间？

A: 创建自定义 QueryClient：

```tsx
import { createQueryClient } from '@feoe/bifrost-chat';

const queryClient = createQueryClient();
queryClient.setDefaultOptions({
  queries: {
    staleTime: 1000 * 60 * 10, // 10 分钟
  },
});

<ReactQueryProvider queryClient={queryClient}>
  {/* ... */}
</ReactQueryProvider>
```

### Q: 如何禁用自动重新获取？

A: 在 QueryClient 配置中设置：

```tsx
const queryClient = createQueryClient();
queryClient.setDefaultOptions({
  queries: {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  },
});
```

## 迁移检查清单

- [ ] 安装 @tanstack/react-query
- [ ] 实现 IConversationService
- [ ] 实现 IMessageService
- [ ] 实现 ITemplateService（如果需要）
- [ ] 使用 ReactQueryProvider 包装应用
- [ ] 使用 ServiceProvider 注入服务
- [ ] 更新组件使用容器组件
- [ ] 更新 Hooks 使用 React Query Hooks
- [ ] 移除对服务端状态的 Zustand 访问
- [ ] 测试功能是否正常
- [ ] 集成 WebSocket（如果需要）

## 需要帮助？

如有问题，请查看：
- [README.md](../README.md) - 完整使用文档
- [docs/reactive-architecture-design.md](reactive-architecture-design.md) - 架构设计文档
- [GitHub Issues](https://github.com/feoe/Bifrost-Chat/issues) - 问题反馈
