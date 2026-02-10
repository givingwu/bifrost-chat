# 消息同步策略（MessageSync）

## 目标

本文档说明 SDK 当前消息同步链路、宿主集成方式，以及常见问题场景（重复模板消息、第二条消息不显示）的定位与处理。

---

## 当前已实现（As-Is）

### 1) 统一事件模型

`IMessageService` 订阅接口已升级为事件对象（含 `conversationId`）：

- `subscribeToMessages(callback: (event: MessageReceivedEvent) => void)`
- `subscribeToMessageStatus(callback: (event: MessageStatusUpdatedEvent) => void)`

对应定义：`src/services/message.service.ts`

### 2) SDK 内部同步服务

SDK 内部通过 `MessageSyncService` 完成“事件 -> 缓存”的统一编排：

- 新消息事件：
  - 先做重复判定（`id/tempId`）
  - 重复则告警并忽略
  - 不重复则写入缓存
- 状态事件：
  - 通过 `updateMessageInCache` 更新 `id/tempId/status`

实现位置：`src/services/message-sync.service.ts`

### 3) 容器层自动接入

`DefaultChatLayout` 已自动调用 `useMessageSync()`，应用方无需手动绑定。

实现位置：

- `src/hooks/use-message-sync.hook.ts`
- `src/components/layout/DefaultChatLayout.tsx`

### 4) 已有测试覆盖

`src/services/message-sync.service.test.ts` 已覆盖：

- 新消息入缓存
- 状态更新链路
- 模板消息状态回调不重复新增
- 重复 `id/tempId` 去重与告警
- 唯一 `id/tempId` 的第二条消息正常显示

---

## 目标架构（To-Be）

- 提供可配置告警上报接口（替代 `console.warn`，接入业务监控）
- 将“重复消息处置策略”配置化（ignore/merge/replace）
- 补充 `useMessageSync` 生命周期级测试（start/stop 次数与清理）

---

## 宿主集成案例

> 推荐方式：宿主只实现 `IMessageService`，SDK 自动同步缓存。

### 案例 1：WebSocket 宿主实现（推荐）

```ts
import type {
  IMessageService,
  MessageReceivedEvent,
  MessageStatusUpdatedEvent,
} from '@/services/message.service';

class HostMessageService implements IMessageService {
  private messageListeners =
    new Set<(event: MessageReceivedEvent) => void>();
  private statusListeners =
    new Set<(event: MessageStatusUpdatedEvent) => void>();

  // 省略 list/send/markAsRead/sendAttachment/sendAudio

  subscribeToMessages(callback: (event: MessageReceivedEvent) => void) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  subscribeToMessageStatus(
    callback: (event: MessageStatusUpdatedEvent) => void,
  ) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onWSMessage(payload: any) {
    if (payload.type === 'new_message') {
      this.messageListeners.forEach((cb) =>
        cb({
          conversationId: payload.conversationId,
          message: payload.message,
        }),
      );
    }

    if (payload.type === 'message_status') {
      this.statusListeners.forEach((cb) =>
        cb({
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          tempId: payload.tempId,
          status: payload.status,
          timestamp: payload.timestamp,
        }),
      );
    }
  }
}
```

### 案例 2：应用侧使用

```tsx
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
```

`DefaultChatLayout` 内已自动执行 `useMessageSync()`。

---

## 关键问题场景与处理

### 场景 A：状态回调后页面出现重复模板消息

**现象**：模板消息发送后，收到状态回调会多一条模板消息。

**常见原因**：

- 状态回调没有匹配到原消息，仅更新了状态字段，未对齐 `id/tempId`
- 业务侧同时有多处订阅写缓存（双写）

**当前处理（As-Is）**：

- `MessageSyncService` 在状态回调里使用 `updateMessageInCache` 同步 `id/tempId/status`
- 默认仅由 `DefaultChatLayout -> useMessageSync` 负责订阅落缓存

**排查建议**：

1. 检查是否仍在业务组件中手写 `subscribeTo*` + 缓存更新
2. 检查状态事件是否带了正确的 `messageId/tempId`

### 场景 B：客户回复第一条能显示，第二条不显示

**现象**：第一条消息显示，后续消息被“吃掉”。

**根因高频项**：

- 第二条消息的 `id` 或 `tempId` 与第一条重复，被去重逻辑拦截

**当前处理（As-Is）**：

- `MessageSyncService` 会先检查 `messageExists`
- 若重复会 `console.warn` 提示检查 WebSocket 消息 ID 唯一性

**宿主必须保证**：

- 每条推送消息 `id` 全局唯一
- 若使用 `tempId`，同一会话内也必须唯一并且不复用

---

## 验证命令

```bash
pnpm exec vitest run src/services/message-sync.service.test.ts
```
