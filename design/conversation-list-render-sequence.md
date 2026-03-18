# 会话列表渲染时序图

## 概述

本文档描述 Bifrost-Chat SDK 中会话列表（ConversationList）的渲染流程时序。

## 时序图

```mermaid
sequenceDiagram
    autonumber
    participant Host as 宿主应用
    participant SP as ServiceProvider
    participant CL as ConversationList
    participant UC as useConversations Hook
    participant RQ as React Query
    participant CS as IConversationService
    participant Store as Zustand Store
    participant CI as ConversationItem

    Note over Host,CI: 初始化阶段

    Host->>SP: 注入服务实现
    SP->>CL: 渲染 ConversationList

    CL->>Store: useActiveConversationId
    Store-->>CL: 返回 activeConversationId

    CL->>UC: useConversations

    UC->>SP: useServices
    SP-->>UC: 返回 conversationService

    UC->>Store: useStrategy
    Store-->>UC: 返回 activeChannel, channelFilterEnabled

    UC->>RQ: useInfiniteQuery
    Note over RQ: queryKey: conversations.list

    RQ->>CS: conversationService.list
    Note over CS: params: current, pageSize, channelType?
    CS-->>RQ: 返回 Conversation[]

    RQ-->>UC: 返回 query data

    UC->>UC: 合并 pending 会话
    UC->>UC: 过滤可见会话
    UC-->>CL: 返回 visibleConversations

    Note over Host,CI: 订阅更新阶段

    UC->>CS: subscribeToListUpdates
    CS-->>UC: 返回 unsubscribe

    UC->>CS: subscribeToConversationUpdates
    Note over CS: 为每个 conversationId 订阅
    CS-->>UC: 返回 unsubscribe callbacks

    Note over Host,CI: 渲染阶段

    CL->>CL: 处理加载/错误/空状态

    alt 会话数量 >= 20 且启用虚拟滚动
        CL->>CL: useVirtualizer 配置
        CL->>CL: 计算虚拟项
        loop 每个虚拟项
            CL->>CI: 渲染 ConversationItem
        end
    else 传统渲染
        loop 每个会话
            CL->>CI: 渲染 ConversationItem
        end
    end

    Note over Host,CI: 触底加载阶段

    CL->>CL: IntersectionObserver 监听
    Note over CL: 用户滚动到底部
    CL->>UC: fetchNextPage
    UC->>RQ: fetchNextPage
    RQ->>CS: conversationService.list
    Note over CS: params: current = nextPage
    CS-->>RQ: 返回 Conversation[]
    RQ-->>UC: 返回新页面数据
    UC-->>CL: 触发重新渲染
```

## 核心流程说明

### 1. 数据获取流程

| 步骤 | 组件 | 职责 |
|------|------|------|
| 1 | [`ConversationList`](src/components/conversation/ConversationList.tsx) | 决定是否自动获取数据 |
| 2 | [`useConversations`](src/hooks/use-conversations.hook.ts) | 调用 React Query infinite query |
| 3 | [`IConversationService.list`](src/services/core/conversation.service.ts) | 宿主实现，返回会话列表 |
| 4 | React Query | 缓存数据，管理分页状态 |

### 2. 状态管理

| 状态类型 | 管理方式 | 用途 |
|----------|----------|------|
| 服务端状态 | React Query | 会话列表、分页信息 |
| 客户端状态 | Zustand | activeConversationId、activeChannel |

### 3. 虚拟滚动

当会话数量 >= 20 且 `enableVirtualization = true` 时：

- 使用 `@tanstack/react-virtual` 的 `useVirtualizer`
- 只渲染可视区域内的会话项
- 动态测量并缓存会话项高度

### 4. 触底加载

```mermaid
flowchart LR
    A[IntersectionObserver] -->|检测到哨兵元素| B[hasNextPage?]
    B -->|是| C[fetchNextPage]
    C --> D[conversationService.list]
    D --> E[合并新数据]
    B -->|否| F[无操作]
```

## 关键接口

### IConversationService

```typescript
interface IConversationService<TListParams = any> {
  list(params?: TListParams): Promise<Conversation[]>;
  subscribeToListUpdates?(callback: (conversations: Conversation[]) => void): () => void;
  subscribeToConversationUpdates?(
    conversationId: string,
    callback: (conversation: Conversation) => void
  ): () => void;
}
```

### Conversation 数据结构

```typescript
interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: ChannelTypeEnum;
  isActive?: boolean;
  status?: ConversationStatusEnum;
}
```

## 相关文件

- [`src/components/conversation/ConversationList.tsx`](src/components/conversation/ConversationList.tsx) - 会话列表组件
- [`src/hooks/use-conversations.hook.ts`](src/hooks/use-conversations.hook.ts) - 会话数据获取 Hook
- [`src/services/core/conversation.service.ts`](src/services/core/conversation.service.ts) - 会话服务接口
- [`src/interfaces/conversation.interface.ts`](src/interfaces/conversation.interface.ts) - 会话类型定义
- [`src/providers/service.provider.tsx`](src/providers/service.provider.tsx) - 服务依赖注入
