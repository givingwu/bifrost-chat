# 未读数量功能使用指南

## 概述

未读功能在会话列表上展示每条会话的未读数，并对外暴露全量未读总数。**会话的未读以 `unreadCount` 为准**，该字段由**订阅方（宿主）实现并提供**（如通过 `IConversationService.list()` 返回）；**库内不自行计算未读数量**，仅维护实时增量（收到新消息 +1、下行 msg_read_ack -1、进入会话清零），与订阅方提供的 `unreadCount` 合并后展示。

## 约束

1. **unreadCount 由订阅方提供**：通过会话列表接口（如 `IConversationService.list()`）返回的 `Conversation.unreadCount` 为基准值，库不计算未读绝对值。
2. **收到新 chat_message**：对应会话的未读展示 **+1**（库内对该会话增量 +1）。
3. **减未读**：**仅在下行 msg_read_ack 时**减未读（库内对该会话增量 -1）；不在 msg_receive_ack 时减。
4. **读会话即全量已读**：用户进入某会话（选中会话）时，该会话的库内未读增量清零，展示立即反映。

## 展示公式

- 单会话展示未读 = `max(0, conversation.unreadCount + 库内该会话增量)`。
- 全量未读总数 = 所有会话的展示未读之和。

## 库内自动处理未读增量

**无需订阅方注册或调用任何未读回调。** 库在挂载 **DefaultChatLayout**（或主动调用 **useUnreadSync()**）时，会内部订阅 `IMessageService.subscribeToMessages` 与 `subscribeToMessageStatus`：

- 收到 **subscribeToMessages** 回调（新消息，通常对应 WebSocket ptype `chat_message`）→ 该会话未读增量 +1。
- 收到 **subscribeToMessageStatus** 回调且 `status === Read`（下行 msg_read_ack）→ 该会话未读增量 -1。

因此，宿主只需在实现 **IMessageService** 时，将 WebSocket 的聊天消息与 ACK 状态事件转发到上述两个订阅（与消息列表、发送状态等现有逻辑共用同一套转发即可），库内会自动维护未读增量。使用自定义布局时，在合适节点（如根布局）调用一次 **useUnreadSync()** 即可启用未读同步。

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

在任意组件内获取当前全量未读总数（基于当前会话列表与库内增量）。

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

会话列表由 `IConversationService.list()` 返回，每条会话需包含 `unreadCount`（由后端或本地逻辑计算）。库会将此值与库内增量合并后展示，不修改、不替代该字段的来源逻辑。

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

- **未读展示**：由本方案（unreadCount + 库内增量）驱动；库内通过订阅 messageService 自动维护增量。
- **协议层已读**：仍由 [mark-as-read-usage.md](./mark-as-read-usage.md) 中的 `MessageService.markAsRead`、InfiniteMessageList 可见消息防抖已读等负责；进入会话时库内会清零该会话的未读增量，与协议层已读上报并行。

## 重置未读状态

用户登出或切换账号时，可调用 `resetChatStore()`，会清空库内未读增量（以及其它客户端状态），避免残留到下一账号。

```ts
import { resetChatStore } from '@feoe/bifrost-chat';

function handleLogout() {
  resetChatStore();
  // ...
}
```
