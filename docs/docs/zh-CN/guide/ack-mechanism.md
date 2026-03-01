# ACK 机制

## 当前已实现（As-Is）

1. **接收 ACK（`msg_receive_ack`）自动发送**
   - 在 `ChatMessageHandler` 收到 `chat_message` 后自动触发。
   - 实现位置：
     - `src/services/websocket/handlers/chat-message.handler.ts`
     - `WebSocketManager.sendReceiveAck(...)`

2. **已读 ACK（`msg_read_ack`）由宿主显式触发**
   - 由宿主在 `IMessageService.markAsRead()` 中调用后端已读接口。
   - 如需协议级 ACK，可调用 `WebSocketManager.sendReadAck(...)`。

## 目标架构（To-Be）

- 提供统一 ACK 发送策略封装（批量已读、重试策略、日志分级）。
- 增强 ACK 可观测性（发送成功率、延迟、失败原因）。

## 接收 ACK 自动发送链路

```ts
// ChatMessageHandler（简化示意）
this.wsManager.sendReceiveAck({
  sender: rawPacket.from.pin,
  app: rawPacket.from.app,
  mid: rawPacket.mid,
  chatId: rawPacket.chatId,
  timestamp: rawPacket.timestamp,
});
```

说明：

- 仅当 `mid` 存在时发送。
- ACK 发送失败不会阻断消息渲染流程。

## 已读 ACK 建议实现

```ts
import type { IMessageService, WebSocketManager } from '@feoe/bifrost-chat';

export class HostMessageService implements IMessageService {
  constructor(private wsManager: WebSocketManager) {}

  async markAsRead(params) {
    // 1) 调用宿主后端接口标记已读
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });

    // 2) 发送协议 ACK（如你的后端需要）
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

  // 其余 IMessageService 方法省略
}
```

## ACK 报文要点

- 上行 ACK ptype：
  - `msg_receive_ack`
  - `msg_read_ack`
- 下行确认 ptype：
  - `ack`
  - `body.type` 对应上行 ACK 类型

更多协议字段见：

- `specs/ACK协议.md`
- `specs/bifrost-client-integration-guide.md`

## 术语说明

- SDK 公开层使用 `conversationId`。
- 协议层 ACK 字段仍使用 `chatId`（历史兼容）。
