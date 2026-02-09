# 消息同步策略

## 概述

本文档说明 Bifrost-Chat SDK 中消息同步的策略，以及如何避免重复消息问题。

## 当前已实现（As-Is）

- ✅ 统一通过 `MessageCacheHelper` 处理 Infinite Query 缓存写入与去重
- ✅ 发送链路在 `onMutate/onSuccess/onError` 中使用 `tempId` 对齐消息
- ✅ 文档中历史 WebSocket 管理器实现已下线，不再作为当前代码路径

## 目标架构（To-Be）

- [ ] 若恢复独立实时通道管理层，保持与 Infinite Query 数据结构统一
- [ ] 进一步将实时消息接入策略抽象为可替换策略层

## 问题背景

### 问题描述

发送模板消息后，回调更新消息状态时，页面会多一条一样的消息记录，刷新后又只剩一条了。

### 根本原因

1. **历史 WebSocket 消息处理与无限查询数据结构不匹配（已修复）**
   - `useMessages` 使用 `useInfiniteQuery`，数据结构为 `{ pages: [{ items: [] }] }`
   - 旧版 `websocket-manager.service.ts`（已移除）中的 `handleNewMessage` 处理的是普通数组 `StandardMessage[]`
   - 导致 WebSocket 推送的消息无法正确合并到无限查询缓存中

2. **时序问题**
   - 发送模板消息的流程：
     - `onMutate` → 创建临时消息（有 `tempId`，无真实 `id`）
     - 发送请求 → 服务器处理
     - `onSuccess` → 更新临时消息的 `id` 为真实 `messageId`
     - WebSocket → 推送新消息事件
   - 如果 WebSocket 推送在 `onSuccess` **之前**到达，去重检查会失败（因为临时消息还没有真实 id）

3. **去重逻辑不完善**
   - 当前去重仅基于 `msg.id`
   - 没有考虑 `tempId` 的匹配
   - 没有处理无限查询的 pages 结构

## 解决方案

### 1. 消息缓存辅助工具

创建了 `MessageCacheHelper` 工具类，提供统一的无限查询缓存更新函数：

```typescript
import { MessageCacheHelper } from '@/services/message-cache-helper.service';

// 添加新消息到缓存（自动去重）
MessageCacheHelper.addMessageToCache(queryClient, conversationId, message);

// 更新消息状态
MessageCacheHelper.updateMessageStatus(
  queryClient,
  conversationId,
  MessageStatusEnum.Sent,
  messageId,
  tempId,
);

// 替换临时消息为真实消息
MessageCacheHelper.replaceTempMessageWithRealMessage(
  queryClient,
  conversationId,
  tempId,
  realMessage,
);
```

### 2. 改进的去重逻辑

新的去重逻辑同时检查 `id` 和 `tempId`：

```typescript
static messageExists(messages: StandardMessage[], message: StandardMessage): boolean {
  return messages.some(
    (msg) =>
      msg.id === message.id ||
      msg.tempId === message.tempId ||
      (message.tempId && msg.tempId === message.tempId) ||
      (message.id && msg.id === message.id),
  );
}
```

### 3. 优化的消息发送流程

使用 `MessageCacheHelper` 优化 `useSendMessage` hook：

```typescript
// onMutate: 添加临时消息
MessageCacheHelper.addMessageToCache(queryClient, conversationId, tempMessage);

// onSuccess: 更新临时消息为真实消息
MessageCacheHelper.updateMessageInCache(
  queryClient,
  conversationId,
  {
    id: data.messageId ?? context?.tempMessage.id,
    status: data.status ?? MessageStatusEnum.Sent,
  },
  undefined, // messageId - 使用 tempId 查找
  tempId, // tempId
);

// onError: 更新消息状态为 Failed
MessageCacheHelper.updateMessageStatus(
  queryClient,
  conversationId,
  MessageStatusEnum.Failed,
  undefined,
  tempId,
);
```

### 4. WebSocket 消息处理优化

更新 `handleNewMessage` 以使用 `MessageCacheHelper`：

```typescript
function handleNewMessage(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  if (!data.conversationId || !data.message) {
    return;
  }

  // 使用 MessageCacheHelper 添加消息到缓存
  // 自动处理无限查询数据结构和去重
  MessageCacheHelper.addMessageToCache(
    queryClient,
    data.conversationId,
    data.message,
  );

  // 更新会话列表...
}
```

## 最佳实践

### 1. 使用 MessageCacheHelper

在所有需要操作消息缓存的地方，使用 `MessageCacheHelper` 而不是直接操作 `queryClient.setQueryData`：

```typescript
// ❌ 错误：直接操作缓存
queryClient.setQueryData(queryKeys.messages.list(conversationId), (old) => {
  // 复杂的无限查询数据结构处理...
});

// ✅ 正确：使用 MessageCacheHelper
MessageCacheHelper.addMessageToCache(queryClient, conversationId, message);
```

### 2. 处理临时消息

发送消息时，始终使用 `tempId` 来标识临时消息：

```typescript
const tempMessage: StandardMessage = MessageBuilder.buildTextMessage(
  content,
  options,
);
tempMessage.status = MessageStatusEnum.Sending;

// 添加到缓存
MessageCacheHelper.addMessageToCache(queryClient, conversationId, tempMessage);

// 发送成功后，通过 tempId 更新
MessageCacheHelper.updateMessageInCache(
  queryClient,
  conversationId,
  { id: realMessageId, status: MessageStatusEnum.Sent },
  undefined,
  tempMessage.tempId,
);
```

### 3. WebSocket 回调处理

确保 WebSocket 回调使用 `MessageCacheHelper`：

```typescript
// 订阅消息状态更新
messageService.subscribeToMessageStatus((update) => {
  MessageCacheHelper.updateMessageStatus(
    queryClient,
    conversationId,
    update.status,
    update.messageId,
    update.tempId,
  );
});

// 订阅新消息
messageService.subscribeToMessages((message) => {
  MessageCacheHelper.addMessageToCache(queryClient, conversationId, message);
});
```

## 测试

运行单元测试验证修复：

```bash
pnpm test message-cache-helper.service.test.ts
```

测试覆盖场景：
- ✅ 消息去重（基于 id 和 tempId）
- ✅ 无限查询数据结构处理
- ✅ 临时消息与真实消息的合并
- ✅ 消息状态更新
- ✅ 时序问题（WebSocket 在 onSuccess 之前到达）

## 相关文件

- `src/services/message-cache-helper.service.ts` - 消息缓存辅助工具
- `src/hooks/use-send-message.hook.ts` - 发送消息链路与缓存写入
- `src/services/message-cache-helper.service.test.ts` - 单元测试

## 迁移指南

如果你有自定义的消息处理逻辑，请按以下步骤迁移：

1. **替换直接操作缓存的代码**

```typescript
// 之前
queryClient.setQueryData(queryKeys.messages.list(conversationId), (old: any) => {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page: any) => ({
      ...page,
      items: [...page.items, newMessage],
    })),
  };
});

// 之后
MessageCacheHelper.addMessageToCache(queryClient, conversationId, newMessage);
```

2. **更新消息状态**

```typescript
// 之前
queryClient.setQueryData(queryKeys.messages.list(conversationId), (old: any) => {
  // 复杂的查找和更新逻辑...
});

// 之后
MessageCacheHelper.updateMessageStatus(
  queryClient,
  conversationId,
  newStatus,
  messageId,
  tempId,
);
```

3. **处理 WebSocket 回调**

```typescript
// 之前
function handleNewMessage(data: WebSocketMessageData) {
  queryClient.setQueryData(/* 复杂逻辑 */);
}

// 之后
function handleNewMessage(data: WebSocketMessageData) {
  MessageCacheHelper.addMessageToCache(
    queryClient,
    data.conversationId,
    data.message,
  );
}
```

## 常见问题

### Q: 为什么会出现重复消息？

A: 主要原因是 WebSocket 推送的新消息与乐观更新的临时消息没有正确去重。新的 `MessageCacheHelper` 通过同时检查 `id` 和 `tempId` 来解决这个问题。

### Q: 如何确保消息不重复？

A: 使用 `MessageCacheHelper.addMessageToCache` 添加消息时，会自动检查消息是否已存在（基于 `id` 和 `tempId`），避免重复添加。

### Q: 时序问题如何解决？

A: 在 `onSuccess` 回调中，使用 `MessageCacheHelper.updateMessageInCache` 通过 `tempId` 更新临时消息，确保在 WebSocket 推送之前完成缓存更新。

### Q: 是否需要修改现有代码？

A: 如果你使用的是 SDK 提供的 hooks（如 `useSendMessage`），不需要修改。如果你有自定义的消息处理逻辑，建议使用 `MessageCacheHelper` 来简化代码并避免重复消息问题。

## 总结

通过引入 `MessageCacheHelper` 工具类，我们：

1. ✅ 统一了无限查询缓存的操作方式
2. ✅ 改进了去重逻辑，同时支持 `id` 和 `tempId`
3. ✅ 优化了消息发送流程，避免时序问题
4. ✅ 简化了 WebSocket 消息处理逻辑
5. ✅ 提供了完整的单元测试覆盖

这个修复确保了消息同步的可靠性，避免了重复消息问题。
