# 未读数量功能使用指南

## 当前已实现（As-Is）

未读功能在会话列表上展示每条会话的未读数，并对外暴露全量未读总数。当前实现中，**`Conversation.unreadCount` 就是唯一展示值**，统一存放在 React Query 的会话缓存里；SDK 不再维护额外的 unread delta。

## 约束

1. **unreadCount 是最终展示值**：会话列表与总未读都直接消费 `Conversation.unreadCount`。
2. **收到新 incoming chat_message**：仅当消息属于非激活会话时，对应会话 `unreadCount +1`。
3. **读会话即立即清零**：用户进入某会话（选中会话）时，该会话 `unreadCount` 立即置为 `0`。
4. **状态事件不直接减未读**：`subscribeToMessageStatus` 仅更新消息状态，不直接减少会话未读，避免把“对方已读我的消息”误算成未读减少。

## 库内自动处理会话未读缓存

**无需订阅方注册或调用任何未读回调。** 库在挂载 **DefaultChatLayout**（或主动调用 **useUnreadSync()**）时，会内部订阅 `IMessageService.subscribeToMessages` 与 `subscribeToMessageStatus`：

- 收到 **subscribeToMessages** 回调（新消息，通常对应 WebSocket ptype `chat_message`）→ 同步消息缓存、刷新会话摘要，并在必要时给会话 `unreadCount +1`。
- 收到 **subscribeToMessageStatus** 回调 → 仅同步消息状态缓存。

因此，宿主只需在实现 **IMessageService** 时，将 WebSocket 的聊天消息与 ACK 状态事件转发到上述两个订阅（与消息列表、发送状态等现有逻辑共用同一套转发即可），库内会自动维护会话缓存。使用自定义布局时，在合适节点（如根布局）调用一次 **useUnreadSync()** 即可启用未读同步。

## 目标架构（To-Be）

- 优先由宿主实现 `IConversationService.subscribeToListUpdates` /
  `subscribeToConversationUpdates`，将服务端权威 `unreadCount` 实时回灌到 SDK。
- 当前 SDK 已接入上述接口；若宿主提供，Query 缓存中的本地 optimistic unread
  会被权威值覆盖。

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

在任意组件内获取当前全量未读总数（基于当前会话列表缓存）。

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

会话列表由 `IConversationService.list()` 返回，每条会话需包含 `unreadCount`（由后端或宿主本地逻辑计算）。SDK 会直接消费该字段并在本地实时事件上做缓存级 optimistic 更新。

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

- **未读展示**：由 `Conversation.unreadCount` 驱动；库内通过订阅 `messageService` 自动维护 Query 缓存。
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
