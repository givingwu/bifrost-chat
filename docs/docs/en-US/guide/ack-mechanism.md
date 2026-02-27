# ACK Mechanism Guide

## Overview

Bifrost Chat SDK provides a complete message ACK (acknowledgment) mechanism to ensure reliable message delivery. The ACK mechanism includes:

1. **Message Receive ACK (msg_receive_ack)**: Automatically sent when client receives a message
2. **Message Read ACK (msg_read_ack)**: Sent when user reads a message

## Message Receive ACK (Automatic)

### How It Works

When the client receives a `chat_message` type message, the SDK automatically sends `msg_receive_ack` to the server.

**Auto-trigger conditions:**
- Received a `chat_message` type packet
- Packet contains server message ID (`mid`)
- WebSocket connection is active

**Auto-send timing:**
- Sent immediately when `ChatMessageHandler` processes the message
- ACK send failure does not affect message processing flow

### Implementation Details

The SDK automatically handles receive ACK in [`ChatMessageHandler`](../../../src/services/websocket/handlers/chat-message.handler.ts):

```typescript
// ChatMessageHandler internal implementation
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

### No Additional Configuration Required

Message receive ACK is automatic, no additional configuration needed from the caller.

## Message Read ACK (Manual)

### How It Works

When a user reads a message, the caller needs to manually send `msg_read_ack` to the server.

**Trigger timing:**
- User views messages (via `MessageList` component's `enableAutoMarkAsRead`)
- Call `IMessageService.markAsRead()` method

### Caller Implementation

The caller needs to send read ACK in their `IMessageService.markAsRead()` implementation.

#### Using MessageAckHelper (Recommended)

The SDK provides [`MessageAckHelper`](../../../src/services/message-ack-helper.service.ts) utility class to simplify ACK sending:

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
    // 1. Call backend API to mark as read
    await this.api.markAsRead(params);

    // 2. Send msg_read_ack (using helper utility)
    for (const messageId of params.messageIds) {
      MessageAckHelper.sendReadAck(this.wsManager, {
        sender: this.currentPin,
        app: this.currentApp,
        messageId,
        chatId: params.conversationId,
        datetime: Date.now(),
        toApp: 'im.waiter', // Configure based on actual business
        toPin: 'customer-pin', // Get from message
      });
    }
  }

  // Other method implementations...
}
```

#### Batch Send Read ACK

For batch read scenarios, use the `sendReadAckBatch` method:

```typescript
async markAsRead(params: {
  conversationId: string;
  messageIds: string[];
}): Promise<void> {
  await this.api.markAsRead(params);

  // Batch send ACK
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

### MessageList Auto Mark as Read

The SDK's [`MessageList`](../../../src/components/messages/MessageList.tsx) component supports automatic mark as read:

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

**Parameter descriptions:**
- `enableAutoMarkAsRead`: Enable auto mark as read (default `false`)
- `markAsReadDebounceDelay`: Debounce delay in milliseconds (default `1000`)

## ACK Protocol Format

### msg_receive_ack (Uplink)

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

### msg_read_ack (Uplink)

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

### ACK Response (Downlink)

Server returns confirmation after receiving ACK:

```json
{
  "id": "msg-123",
  "ptype": "ack",
  "body": {
    "type": "msg_receive_ack" // or "msg_read_ack"
  },
  "ver": "1.0",
  "timestamp": 1234567890000
}
```

## Error Handling

### ACK Send Failure

The SDK provides fault tolerance for ACK send failures:

- **Does not affect message processing**: ACK send failure does not interrupt message processing flow
- **Logging**: Errors are logged to console for debugging
- **Silent skip**: When WebSocket is not connected, silently skip ACK sending

```typescript
// MessageAckHelper internal implementation
static sendReadAck(wsManager: WebSocketManager, params: ReadAckParams): void {
  if (!wsManager.isConnected()) {
    console.warn('[MessageAckHelper] WebSocket not connected, skipping read ACK');
    return;
  }

  try {
    wsManager.sendReadAck(params);
  } catch (error) {
    console.error('[MessageAckHelper] Failed to send read ACK:', error);
    // Don't throw error to avoid affecting read marking flow
  }
}
```

## Best Practices

### 1. Always Send ACK in markAsRead

Ensure to send read ACK in `markAsRead()` implementation:

```typescript
async markAsRead(params): Promise<void> {
  // 1. Call backend API first
  await api.markAsRead(params);

  // 2. Then send ACK (ensure backend has processed)
  MessageAckHelper.sendReadAck(this.wsManager, ackParams);
}
```

### 2. Get Correct toPin

Get the receiver's PIN from the message:

```typescript
const message = await this.getMessage(messageId);
const toPin = message.sender.pin; // Message sender's PIN

MessageAckHelper.sendReadAck(this.wsManager, {
  // ...
  toPin,
});
```

### 3. Batch Processing Optimization

For large numbers of messages, use batch send method:

```typescript
// ✅ Recommended: Batch send
MessageAckHelper.sendReadAckBatch(this.wsManager, ackParams);

// ❌ Not recommended: Loop send
for (const params of ackParams) {
  MessageAckHelper.sendReadAck(this.wsManager, params);
}
```

### 4. Error Monitoring

Although ACK send failure doesn't affect functionality, it's recommended to monitor errors:

```typescript
try {
  MessageAckHelper.sendReadAck(this.wsManager, params);
} catch (error) {
  // Report to error monitoring system
  errorTracker.captureException(error);
}
```

## Complete Example

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
    // 1. Call backend API
    await this.api.markAsRead(params);

    // 2. Get message info (for getting toPin)
    const messages = await this.api.getMessages(params.messageIds);

    // 3. Batch send read ACK
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

  // Other method implementations...
}
```

## References

- [ACK Protocol Specification](../../../specs/ACK协议.md)
- [Chat Message Protocol](../../../specs/聊天消息协议.md)
- [MessageAckHelper API](../../../src/services/message-ack-helper.service.ts)
- [ChatMessageHandler Implementation](../../../src/services/websocket/handlers/chat-message.handler.ts)
