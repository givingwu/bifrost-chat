# 未读数量功能使用指南

## 当前已实现（As-Is）

未读功能在会话列表上展示每条会话的未读数，并对外暴露全量未读总数。当前实现中，未读由 **服务端基线 + React Query 增量映射** 计算：

- 会话级基线：`Conversation.unreadCount`
- 渠道级/总数基线：`conversationService.getUnreadCount()`（若宿主实现）
- 前端增量：`queryKeys.conversations.unreadDeltas.channel()` 与
  `queryKeys.conversations.unreadDeltas.conversation()`

SDK 不把未读数量写入 Zustand。

## 约束

1. **unreadCount 是服务端基线**：会话列表展示值为
   `max(0, conversation.unreadCount + delta)`。
2. **收到新 incoming chat_message**：`useUnreadSync` 维护会话级与渠道级
   delta `+1`；标记为离线推送的消息不会增加 delta。
3. **读回执扣减 delta**：当 `subscribeToMessageStatus` 回灌
   `status === Read` 且包含 `conversationId` 时，SDK 在基线保护下扣减
   会话级与渠道级 delta。
4. **服务端权威回灌**：宿主若实现 `subscribeToListUpdates` /
   `subscribeToConversationUpdates`，SDK 会用服务端会话更新覆盖缓存，并保留
   必要的负 delta 防止未读回跳。

## 库内自动处理会话未读缓存

**无需订阅方注册或调用任何未读回调。** 库在挂载 **DefaultChatLayout**（或主动调用 **useUnreadSync()**）时，会内部订阅 `IMessageService.subscribeToMessages` 与 `subscribeToMessageStatus`：

- 收到 **subscribeToMessages** 回调（新消息，通常对应 WebSocket ptype
  `chat_message`）→ 同步消息缓存、刷新会话摘要，并在必要时给未读 delta
  `+1`。
- 收到 **subscribeToMessageStatus** 回调 → 同步消息状态缓存；`Read` ACK
  会在基线保护下扣减未读 delta。

因此，宿主只需在实现 **IMessageService** 时，将 WebSocket 的聊天消息与 ACK 状态事件转发到上述两个订阅（与消息列表、发送状态等现有逻辑共用同一套转发即可），库内会自动维护会话缓存。使用自定义布局时，在合适节点（如根布局）调用一次 **useUnreadSync()** 即可启用未读同步。

## 目标架构（To-Be）

- 优先由宿主实现 `IConversationService.subscribeToListUpdates` /
  `subscribeToConversationUpdates`，将服务端权威 `unreadCount` 实时回灌到 SDK。
- 当前 SDK 已接入上述接口；若宿主提供，Query 缓存中的会话基线会被权威值
  覆盖。
- 后续可统一服务端未读基线、会话订阅回灌和 ACK 回灌的优先级文档。

## 获取全量未读总数

### 方式 A：DefaultChatLayout 回调

通过 `onTotalUnreadChange` 在总未读数变化时收到回调，便于埋点、标题栏徽章等。

```tsx
<DefaultChatLayout
  onTotalUnreadChange={(total) => {
    document.title = total > 0 ? `(${total}) 客服工作台` : '客服工作台';
  }}
/>
```

### 方式 B：useTotalUnread Hook

在任意组件内获取当前全量未读总数（基于渠道级服务端基线与前端 delta）。

```tsx
import { useTotalUnread } from '@feoe/bifrost-chat';

function TitleBar() {
  const { totalUnread } = useTotalUnread();
  return (
    <span>
      会话
      {totalUnread > 0 && (
        <span className="badge">{totalUnread}</span>
      )}
    </span>
  );
}
```

## 订阅方提供 unreadCount

会话列表由 `IConversationService.list()` 返回，每条会话需包含 `unreadCount`
（由后端或宿主本地逻辑计算）。SDK 会把该字段作为服务端基线，并在本地实时事件上维护 React Query delta。

```ts
// 示例：会话列表项需包含 unreadCount
interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number; // 由订阅方实现并返回
  channel: ChannelTypeEnum;
  // ...
}
```

## 与 MarkAsRead 的关系

- **未读展示**：由 `Conversation.unreadCount` / `getUnreadCount()` 基线加
  React Query delta 驱动；库内通过订阅 `messageService` 自动维护 Query
  缓存。
- **协议层已读**：仍由 [mark-as-read-usage.md](./mark-as-read-usage.md) 中的 `MessageService.markAsRead`、InfiniteMessageList 可见消息防抖已读等负责；进入会话时库内会立即清零该会话 `unreadCount`，与协议层已读上报并行。

## 重置状态

用户登出或切换账号时，可调用 `resetChatStore()`，会清空客户端交互态（如激活会话、搜索词等），避免残留到下一账号。会话未读缓存属于 React Query 数据，应由 `clearQueryCache()` 或新的 QueryClient 生命周期统一管理。

```ts
import { resetChatStore } from '@feoe/bifrost-chat';

function handleLogout() {
  resetChatStore();
  // ...
}
```
