# ACK 机制使用指南

## 概述

Bifrost Chat SDK 提供了完整的消息 ACK（确认）机制，确保消息可靠传递。ACK 机制包括：

1. **消息接收 ACK（msg_receive_ack）**：客户端收到消息后自动发送
2. **消息已读 ACK（msg_read_ack）**：用户阅读消息后发送

## 消息接收 ACK（自动）

### 工作原理

当客户端收到 `chat_message` 类型的消息时，SDK 会自动发送 `msg_receive_ack` 给服务端。

**自动触发条件：**
- 收到 `chat_message` 类型的数据包
- 数据包包含服务端消息 ID（`mid`）
- WebSocket 连接正常

**自动发送时机：**
- 在 `ChatMessageHandler` 处理消息时立即发送
- ACK 发送失败不影响消息处理流程

### 实现细节

SDK 在 [`ChatMessageHandler`](../../../src/services/websocket/handlers/chat-message.handler.ts) 中自动处理接收 ACK：

```typescript
// ChatMessageHandler 内部实现
private sendReceiveAck(rawPacket: RawPacket, currentPin?: string): void {
  if (!this.wsManager || !rawPacket.mid) {
    return;
  }

  MessageAckHelper.sendReceiveAck(this.wsManager, {
    sender: currentPin || rawPacket.to.pin || '',
    app: rawPacket.to.app,
    messageId: rawPacket.mid,
    chatId: rawPacket.chatId || '',
    datetime: rawPacket.timestamp,
    toApp: rawPacket.from.app,
    toPin: rawPacket.from.pin,
  });
}
```

### 无需额外配置

消息接收 ACK 是自动的，调用方无需任何额外配置。

## 消息已读 ACK（手动）

### 工作原理

当用户阅读消息后，调用方需要手动发送 `msg_read_ack` 给服务端。

**触发时机：**
- 用户查看消息（通过 `MessageList` 组件的 `enableAutoMarkAsRead`）
- 调用 `IMessageService.markAsRead()` 方法

### 调用方实现

调用方需要在 `IMessageService.markAsRead()` 实现中发送已读 ACK。

#### 使用 MessageAckHelper（推荐）

SDK 提供了 [`MessageAckHelper`](../../../src/services/message-ack-helper.service.ts) 工具类简化 ACK 发送：

```typescript
import { MessageAckHelper } from '@bifrost-chat/sdk';
import type { IMessageService } from '@bifrost-chat/sdk';

class MyMessageService implements IMessageService {
  constructor(
    private api: MyApi,
    private wsManager: WebSocketManager,
    private currentPin: string,
    private currentApp: string,
  ) {}

  async markAsRead(params: {
    conversationId: string;
    messageIds: string[];
  }): Promise<void> {
    // 1. 调用后端 API 标记已读
    await this.api.markAsRead(params);

    // 2. 发送 msg_read_ack（使用辅助工具）
    for (const messageId of params.messageIds) {
      MessageAckHelper.sendReadAck(this.wsManager, {
        sender: this.currentPin,
        app: this.currentApp,
        messageId,
        chatId: params.conversationId,
        datetime: Date.now(),
        toApp: 'im.waiter', // 根据实际业务配置
        toPin: 'customer-pin', // 从消息中获取
      });
    }
  }

  // 其他方法实现...
}
```

#### 批量发送已读 ACK

对于批量已读场景，可以使用 `sendReadAckBatch` 方法：

```typescript
async markAsRead(params: {
  conversationId: string;
  messageIds: string[];
}): Promise<void> {
  await this.api.markAsRead(params);

  // 批量发送 ACK
  const ackParams = params.messageIds.map((messageId) => ({
    sender: this.currentPin,
    app: this.currentApp,
    messageId,
    chatId: params.conversationId,
    datetime: Date.now(),
    toApp: 'im.waiter',
    toPin: 'customer-pin',
  }));

  MessageAckHelper.sendReadAckBatch(this.wsManager, ackParams);
}
```

### MessageList 自动标记已读

SDK 的 [`MessageList`](../../../src/components/messages/MessageList.tsx) 组件支持自动标记已读：

```tsx
import { MessageList } from '@bifrost-chat/sdk';

function ChatPanel({ conversationId }) {
  return (
    <MessageList
      messages={messages}
      conversationId={conversationId}
      enableAutoMarkAsRead={true}
      markAsReadDebounceDelay={1000}
    />
  );
}
```

**参数说明：**
- `enableAutoMarkAsRead`：启用自动标记已读（默认 `false`）
- `markAsReadDebounceDelay`：防抖延迟，单位毫秒（默认 `1000`）

## ACK 协议格式

### msg_receive_ack（上行）

```json
{
  "id": "msg-123",
  "from": {
    "app": "fox_collect.waiter",
    "pin": "agent-123"
  },
  "to": {
    "app": "im.waiter",
    "pin": "customer-456"
  },
  "ptype": "msg_receive_ack",
  "body": {
    "sender": "agent-123",
    "app": "fox_collect.waiter",
    "mid": "server-msg-456",
    "chatId": "conv-789",
    "datetime": 1234567890000
  },
  "ver": "1.0",
  "timestamp": 1234567890000
}
```

### msg_read_ack（上行）

```json
{
  "id": "msg-123",
  "from": {
    "app": "fox_collect.waiter",
    "pin": "agent-123"
  },
  "to": {
    "app": "im.waiter",
    "pin": "customer-456"
  },
  "ptype": "msg_read_ack",
  "body": {
    "sender": "agent-123",
    "app": "fox_collect.waiter",
    "mid": "server-msg-456",
    "chatId": "conv-789",
    "datetime": 1234567890000
  },
  "ver": "1.0",
  "timestamp": 1234567890000
}
```

### ACK 响应（下行）

服务端收到 ACK 后返回确认：

```json
{
  "id": "msg-123",
  "ptype": "ack",
  "body": {
    "type": "msg_receive_ack" // 或 "msg_read_ack"
  },
  "ver": "1.0",
  "timestamp": 1234567890000
}
```

## 错误处理

### ACK 发送失败

SDK 对 ACK 发送失败进行了容错处理：

- **不影响消息处理**：ACK 发送失败不会中断消息处理流程
- **日志记录**：错误会被记录到控制台，便于调试
- **静默跳过**：WebSocket 未连接时，静默跳过 ACK 发送

```typescript
// MessageAckHelper 内部实现
static sendReadAck(wsManager: WebSocketManager, params: ReadAckParams): void {
  if (!wsManager.isConnected()) {
    console.warn('[MessageAckHelper] WebSocket not connected, skipping read ACK');
    return;
  }

  try {
    wsManager.sendReadAck(params);
  } catch (error) {
    console.error('[MessageAckHelper] Failed to send read ACK:', error);
    // 不抛出错误，避免影响已读标记流程
  }
}
```

## 最佳实践

### 1. 始终在 markAsRead 中发送 ACK

确保在 `markAsRead()` 实现中发送已读 ACK：

```typescript
async markAsRead(params): Promise<void> {
  // 1. 先调用后端 API
  await api.markAsRead(params);

  // 2. 再发送 ACK（确保后端已处理）
  MessageAckHelper.sendReadAck(this.wsManager, ackParams);
}
```

### 2. 获取正确的 toPin

从消息中获取接收方的 PIN：

```typescript
const message = await this.getMessage(messageId);
const toPin = message.sender.pin; // 消息发送者的 PIN

MessageAckHelper.sendReadAck(this.wsManager, {
  // ...
  toPin,
});
```

### 3. 批量处理优化

对于大量消息，使用批量发送方法：

```typescript
// ✅ 推荐：批量发送
MessageAckHelper.sendReadAckBatch(this.wsManager, ackParams);

// ❌ 不推荐：循环发送
for (const params of ackParams) {
  MessageAckHelper.sendReadAck(this.wsManager, params);
}
```

### 4. 错误监控

虽然 ACK 发送失败不影响功能，但建议监控错误：

```typescript
try {
  MessageAckHelper.sendReadAck(this.wsManager, params);
} catch (error) {
  // 上报到错误监控系统
  errorTracker.captureException(error);
}
```

## 完整示例

```typescript
import { MessageAckHelper } from '@bifrost-chat/sdk';
import type { IMessageService } from '@bifrost-chat/sdk';
import type { WebSocketManager } from '@bifrost-chat/sdk';

class MyMessageService implements IMessageService {
  constructor(
    private api: MyApi,
    private wsManager: WebSocketManager,
    private config: {
      currentPin: string;
      currentApp: string;
      toApp: string;
    },
  ) {}

  async markAsRead(params: {
    conversationId: string;
    messageIds: string[];
  }): Promise<void> {
    // 1. 调用后端 API
    await this.api.markAsRead(params);

    // 2. 获取消息信息（用于获取 toPin）
    const messages = await this.api.getMessages(params.messageIds);

    // 3. 批量发送已读 ACK
    const ackParams = messages.map((message) => ({
      sender: this.config.currentPin,
      app: this.config.currentApp,
      messageId: message.id,
      chatId: params.conversationId,
      datetime: Date.now(),
      toApp: this.config.toApp,
      toPin: message.sender.pin,
    }));

    MessageAckHelper.sendReadAckBatch(this.wsManager, ackParams);
  }

  // 其他方法实现...
}
```

## 参考文档

- [ACK 协议规范](../../../specs/ACK协议.md)
- [聊天消息协议](../../../specs/聊天消息协议.md)
- [MessageAckHelper API](../../../src/services/message-ack-helper.service.ts)
- [ChatMessageHandler 实现](../../../src/services/websocket/handlers/chat-message.handler.ts)
