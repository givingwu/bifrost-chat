# ACK Mechanism

## Current Implementation (As-Is)

1. **Receive ACK (`msg_receive_ack`) is automatic**
   - Triggered after `chat_message` handling in `ChatMessageHandler`.
   - Implementation:
     - `src/services/websocket/handlers/chat-message.handler.ts`
     - `WebSocketManager.sendReceiveAck(...)`

2. **Read ACK (`msg_read_ack`) is host-driven**
   - Host app performs read marking in `IMessageService.markAsRead()`.
   - If protocol ACK is required, host explicitly calls
     `WebSocketManager.sendReadAck(...)`.

## Target Architecture (To-Be)

- Unified ACK sending strategy (batch read ACK, retry, diagnostics).
- Better ACK observability (success rate, latency, failure reason).

## Auto Receive ACK Flow

```ts
// ChatMessageHandler (simplified)
this.wsManager.sendReceiveAck({
  sender: rawPacket.from.pin,
  app: rawPacket.from.app,
  mid: rawPacket.mid,
  chatId: rawPacket.chatId,
  timestamp: rawPacket.timestamp,
});
```

Notes:

- ACK is sent only when `mid` exists.
- ACK failure does not block message rendering.

## Recommended Read ACK Implementation

```ts
import type { IMessageService, WebSocketManager } from '@feoe/bifrost-chat';

export class HostMessageService implements IMessageService {
  constructor(private wsManager: WebSocketManager) {}

  async markAsRead(params) {
    // 1) Mark read in host backend
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });

    // 2) Send protocol ACK if required by your backend
    for (const messageId of params.messageIds) {
      this.wsManager.sendReadAck({
        sender: 'agent-pin',
        app: 'fox_collect.waiter',
        mid: messageId,
        chatId: params.conversationId,
        timestamp: Date.now(),
      });
    }
  }

  // other IMessageService methods omitted
}
```

## ACK Packet Basics

- Uplink ACK ptypes:
  - `msg_receive_ack`
  - `msg_read_ack`
- Downlink confirmation:
  - ptype: `ack`
  - `body.type`: the original uplink ACK type

See also:

- `specs/ACK协议.md`
- `specs/bifrost-client-integration-guide.md`

## Terminology

- Public SDK naming uses `conversationId`.
- Protocol ACK payload still uses `chatId` for historical compatibility.
