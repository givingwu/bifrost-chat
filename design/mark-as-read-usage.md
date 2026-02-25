# MarkAsRead 功能使用指南

## 概述

markAsRead 功能允许消息列表自动标记用户已查看的未读消息。当用户滚动消息列表时，系统会自动收集可见的未读消息 ID，并在滚动结束后通过防抖机制调用 `MessageService.markAsRead` 方法上报服务器。

## 功能特性

- ✅ **自动收集未读消息**：基于消息的 `status` 字段自动判断是否未读（非 `Read` 状态）
- ✅ **可见性检测**：利用虚拟滚动和 Intersection Observer API 检测可见消息
- ✅ **滚动防抖**：滚动结束后延迟 1s 调用 API，避免频繁请求
- ✅ **去重机制**：使用 Set 数据结构避免重复上报同一消息
- ✅ **性能优化**：支持虚拟滚动和传统渲染两种模式
- ✅ **可配置**：可通过 props 控制是否启用和防抖延迟

## 基础使用

### 1. 使用 InfiniteMessageList（推荐）

```tsx
import { InfiniteMessageList } from '@/components/messages/InfiniteMessageList';

function ChatPanel({ conversationId }) {
  return (
    <InfiniteMessageList
      conversationId={conversationId}
      enableAutoMarkAsRead={true} // 默认 true
      markAsReadDebounceDelay={1000} // 默认 1000ms
    />
  );
}
```

### 2. 使用 MessageList

```tsx
import { MessageList } from '@/components/messages/MessageList';

function ChatPanel({ conversationId, messages }) {
  return (
    <MessageList
      messages={messages}
      conversationId={conversationId}
      enableAutoMarkAsRead={true} // 默认 false
      markAsReadDebounceDelay={1000} // 默认 1000ms
    />
  );
}
```

## 配置选项

### MessageList Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableAutoMarkAsRead` | `boolean` | `false` | 是否启用自动标记已读 |
| `markAsReadDebounceDelay` | `number` | `1000` | 标记已读的防抖延迟（毫秒） |
| `conversationId` | `string` | `undefined` | 会话 ID（必需，用于 markAsRead 调用） |

### InfiniteMessageList Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableAutoMarkAsRead` | `boolean` | `true` | 是否启用自动标记已读 |
| `markAsReadDebounceDelay` | `number` | `1000` | 标记已读的防抖延迟（毫秒） |

### 示例：自定义配置

```tsx
<InfiniteMessageList
  conversationId="conv-123"
  enableAutoMarkAsRead={true}
  markAsReadDebounceDelay={1500}
/>
```

## 服务端实现

### 1. 实现 IMessageService

```typescript
import type { IMessageService } from '@/services/message.service';

// 定义 markAsRead 参数类型
interface MyMarkAsReadParams {
  conversationId: string;
  messageIds: string[];
}

class MyMessageService
  implements IMessageService<any, any, MyMarkAsReadParams, any, any> {
  
  async markAsRead(params: MyMarkAsReadParams): Promise<void> {
    // 调用你的 API 标记消息已读
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: params.conversationId,
        messageIds: params.messageIds,
      }),
    });
  }
  
  // ... 其他方法实现
}
```

### 2. 注入服务

```tsx
import { ServiceProvider } from '@/providers/service.provider';
import { MyMessageService } from './services/my-message.service';

const messageService = new MyMessageService();

function App() {
  return (
    <ServiceProvider
      messageService={messageService}
    >
      <ChatPanel />
    </ServiceProvider>
  );
}
```

## API 参数说明

### MarkAsReadParams

```typescript
interface MarkAsReadParams {
  /** 会话 ID */
  conversationId: string;
  /** 未读消息 ID 列表 */
  messageIds: string[];
}
```

## 工作流程

```
用户滚动消息列表
    ↓
检测可见消息（虚拟滚动 / Intersection Observer）
    ↓
筛选未读消息（status !== Read）
    ↓
添加到已读集合（Set 去重）
    ↓
滚动结束检测（150ms 无滚动）
    ↓
防抖延迟（默认 1000ms）
    ↓
调用 MessageService.markAsRead({ conversationId, messageIds })
    ↓
清空已读集合
```

## 高级用法

### 1. 禁用自动标记已读

```tsx
<InfiniteMessageList
  conversationId="conv-123"
  enableAutoMarkAsRead={false}
/>
```

### 2. 自定义防抖延迟

```tsx
<InfiniteMessageList
  conversationId="conv-123"
  markAsReadDebounceDelay={2000} // 2 秒
/>
```

### 3. 禁用虚拟滚动

```tsx
<MessageList
  messages={messages}
  conversationId="conv-123"
  enableVirtualization={false}
  enableAutoMarkAsRead={true}
/>
```

## 注意事项

### 1. 消息数据要求

确保消息对象包含 `status` 字段：

```typescript
interface StandardMessage {
  id: string;
  status: MessageStatusEnum; // 必需
  // ... 其他字段
}
```

### 2. 消息状态说明

只有状态为 `Read` 的消息才认为已读。其他状态（`Created`、`Sending`、`Sent`、`Delivered` 等）都会被标记为未读。

```typescript
enum MessageStatusEnum {
  Created = 'created',
  Sending = 'sending',
  Sent = 'sent',
  Delivered = 'delivered',
  Read = 'read', // 只有这个状态认为已读
  Failed = 'failed',
  Queued = 'queued',
}
```

### 3. 服务端实现

- 服务端需要实现 `markAsRead` 方法
- 参数格式为 `{ conversationId: string, messageIds: string[] }`
- 返回类型为 `Promise<void>`

### 4. 性能考虑

- 只处理可见的消息，不加载额外数据
- 使用 Set 数据结构避免重复上报
- 建议防抖延迟设置在 500-2000ms 之间

### 5. 虚拟滚动兼容

- 虚拟滚动模式：使用 `virtualizer.getVirtualItems()` 获取可见项
- 传统渲染模式：使用 Intersection Observer API
- 两种模式自动切换，无需手动配置

## 故障排查

### 问题 1：markAsRead 未调用

**可能原因**：
1. `enableAutoMarkAsRead` 设置为 `false`
2. `conversationId` 未提供
3. 没有可见的未读消息
4. 服务端未实现 `markAsRead` 方法

**解决方案**：
```tsx
// 检查配置
<InfiniteMessageList
  conversationId="conv-123" // 必需
  enableAutoMarkAsRead={true}
/>

// 检查服务端实现
console.log('messageService:', messageService);
console.log('markAsRead:', typeof messageService.markAsRead);
```

### 问题 2：重复标记同一消息

**可能原因**：
防抖延迟设置过短

**解决方案**：
```tsx
<InfiniteMessageList
  conversationId="conv-123"
  markAsReadDebounceDelay={2000} // 增加延迟
/>
```

### 问题 3：标记不及时

**可能原因**：
防抖延迟设置过长

**解决方案**：
```tsx
<InfiniteMessageList
  conversationId="conv-123"
  markAsReadDebounceDelay={500} // 减少延迟
/>
```

### 问题 4：所有消息都被标记为已读

**可能原因**：
消息状态判断错误，所有消息的 `status` 都是 `Read`

**解决方案**：
```tsx
// 检查消息状态
console.log('messages:', messages.map(m => ({
  id: m.id,
  status: m.status,
})));
```

## 与会话级别标记的区别

### 会话级别（原方案）
- 基于 `Conversation.unreadCount`
- 在 `ConversationList` 中实现
- 标记整个会话为已读

### 消息级别（当前方案）
- 基于 `Message.status`
- 在 `MessageList` / `InfiniteMessageList` 中实现
- 精确标记哪些消息已读
- 更符合用户实际使用场景

## 相关文档

- [消息接口定义](../src/interfaces/message.interface.ts)
- [MessageList 组件](../src/components/messages/MessageList.tsx)
- [InfiniteMessageList 组件](../src/components/messages/InfiniteMessageList.tsx)
- [useMarkAsRead Hook](../src/hooks/use-mark-as-read.hook.ts)
- [useUnreadMessagesCollector Hook](../src/hooks/use-unread-messages-collector.hook.ts)
- [useVisibleMessages Hook](../src/hooks/use-visible-messages.hook.ts)
