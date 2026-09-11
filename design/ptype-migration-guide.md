# ptype 迁移指南

## 概述

本文档说明如何将 socket 通信协议从使用 `type` 字段迁移到使用 `ptype` 字段。

## 为什么需要迁移？

### 当前已实现（As-Is）

在之前的实现中，协议文档和代码中存在 `type` 和 `ptype` 两种字段的使用：

- **协议文档不一致**：
  - `Packet包协议.md` 使用 `ptype`
  - `心跳协议.md` 使用 `type`
  - `ACK协议.md` 使用 `type`
  - `status_switch协议.md` 使用 `type`
  - `聊天消息协议.md` 使用 `type`（但这里的 `type` 是指 body 内的消息类型）

- **代码中的兼容逻辑**：
  - `WebSocketManager.normalizeToRawPacket()` 有回退逻辑，优先使用 `ptype`，如果没有则回退到 `type`
  - `WebSocketManager.convertProtocolEvent()` 也有类似的回退逻辑

### 目标架构（To-Be）

统一使用 `ptype` 作为协议消息类型字段，确保：

1. **一致性**：所有协议文档和代码使用相同的字段名
2. **明确性**：`ptype` 专门用于协议层面的消息类型，`body.type` 用于消息内容类型
3. **可维护性**：移除兼容逻辑，简化代码

## 字段说明

### ptype（协议类型）

- **用途**：标识协议层面的消息类型
- **必填**：是
- **位置**：协议包的顶层
- **有效值**：
  - `auth` - 登录鉴权
  - `auth_fail` - 登录失败
  - `chat_message` - 聊天消息
  - `ack` - ACK 确认
  - `msg_receive_ack` - 客户端已收
  - `msg_read_ack` - 客户端已读
  - `client_heartbeat` - 心跳
  - `status_switch` - 状态切换
  - `fox_message_ack` - 触达回复消息发送结果

### body.type（内容类型）

- **用途**：标识消息内容的类型
- **必填**：否（仅聊天消息需要）
- **位置**：`body` 对象内部
- **有效值**：
  - `text` - 文本消息
  - `image` - 图片消息
  - `video` - 视频消息
  - `voice` - 音频消息
  - `file` - 文件消息
  - `template` - 模板消息
  - `location` - 位置消息
  - `rich_media` - 富媒体消息

## 迁移步骤

### 步骤 1：更新协议文档

确保所有协议文档使用 `ptype` 字段：

```json
// ❌ 错误（旧格式）
{
  "type": "chat_message",
  "body": { ... }
}

// ✅ 正确（新格式）
{
  "ptype": "chat_message",
  "body": { ... }
}
```

### 步骤 2：更新代码实现

#### 发送消息

```typescript
// ❌ 错误（旧格式）
const packet = {
  id: 'msg-123',
  from: { app: 'test', pin: '123' },
  to: { app: 'test', pin: '456' },
  type: 'chat_message', // 错误：使用了 type
  body: { type: 'text', content: { text: 'Hello' } },
  ver: '1.0',
  timestamp: Date.now()
};

// ✅ 正确（新格式）
const packet = {
  id: 'msg-123',
  from: { app: 'test', pin: '123' },
  to: { app: 'test', pin: '456' },
  ptype: 'chat_message', // 正确：使用了 ptype
  body: { type: 'text', content: { text: 'Hello' } },
  ver: '1.0',
  timestamp: Date.now()
};
```

#### 接收消息

```typescript
// ❌ 错误（旧格式）
if (packet.type === 'chat_message') {
  // 处理聊天消息
}

// ✅ 正确（新格式）
if (packet.ptype === 'chat_message') {
  // 处理聊天消息
}
```

### 步骤 3：使用验证工具

SDK 提供了 `PacketValidator` 工具类来验证数据包：

```typescript
import { PacketValidator } from '@feoe/bifrost-chat';

// 验证数据包是否包含有效的 ptype
if (PacketValidator.hasValidPtype(data)) {
  // 数据包有效
}

// 确保数据包包含 ptype，否则抛出错误
try {
  PacketValidator.ensurePtype(data);
  // 数据包有效，继续处理
} catch (error) {
  // 数据包无效，处理错误
  console.error(error.message);
}

// 验证数据包是否为有效的 RawPacket 格式
if (PacketValidator.isValidRawPacket(data)) {
  // 数据包格式正确
}

// 获取数据包的 ptype 值
const ptype = PacketValidator.getPtype(data);
if (ptype) {
  console.log('Protocol type:', ptype);
}
```

## 常见问题

### Q1：为什么不能同时使用 `type` 和 `ptype`？

**A**：为了避免混淆和歧义。`type` 这个名称太通用，容易与 `body.type` 混淆。使用 `ptype`（packet type）可以明确表示这是协议层面的消息类型。

### Q2：现有的旧格式消息还能处理吗？

**A**：不能。新版本已经移除了对 `type` 字段的兼容逻辑。所有消息必须使用 `ptype` 字段。

### Q3：如何确保我的代码使用了正确的字段？

**A**：
1. 使用 `PacketValidator` 工具类进行验证
2. 查看 TypeScript 类型定义，`RawPacket` 接口要求 `ptype` 为必填字段
3. 参考协议文档和示例代码

### Q4：`body.type` 还需要保留吗？

**A**：需要。`body.type` 用于标识消息内容的类型（如 `text`、`image` 等），与 `ptype` 的用途不同。

## 示例对比

### 聊天消息

```json
// ❌ 错误（旧格式）
{
  "id": "msg-123",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "example_chat.customer", "pin": "customer-789" },
  "type": "chat_message",
  "body": {
    "type": "text",
    "content": { "text": "Hello" }
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}

// ✅ 正确（新格式）
{
  "id": "msg-123",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "example_chat.customer", "pin": "customer-789" },
  "ptype": "chat_message",
  "body": {
    "type": "text",
    "content": { "text": "Hello" }
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}
```

### 心跳消息

```json
// ❌ 错误（旧格式）
{
  "id": "heartbeat-123",
  "type": "client_heartbeat",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "example.chat" },
  "body": {},
  "ver": "1.0",
  "timestamp": 1769063279192
}

// ✅ 正确（新格式）
{
  "id": "heartbeat-123",
  "ptype": "client_heartbeat",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "example.chat" },
  "body": {},
  "ver": "1.0",
  "timestamp": 1769063279192
}
```

### ACK 消息

```json
// ❌ 错误（旧格式）
{
  "id": "ack-123",
  "type": "ack",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "im.waiter", "pin": "customer-789" },
  "body": {
    "type": "msg_read_ack"
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}

// ✅ 正确（新格式）
{
  "id": "ack-123",
  "ptype": "ack",
  "from": { "app": "example_chat.waiter", "pin": "agent-456" },
  "to": { "app": "im.waiter", "pin": "customer-789" },
  "body": {
    "type": "msg_read_ack"
  },
  "ver": "1.0",
  "timestamp": 1769063279192
}
```

## 相关文档

- [Packet包协议](../specs/Packet包协议.md)
- [聊天消息协议](../specs/聊天消息协议.md)
- [心跳协议](../specs/心跳协议.md)
- [ACK协议](../specs/ACK协议.md)
- [status_switch协议](../specs/status_switch协议.md)
- [协议层实现](../src/services/protocol/README.md)

## 总结

- ✅ 所有 socket 通信协议必须使用 `ptype` 字段
- ✅ `ptype` 是必填字段，用于标识协议层面的消息类型
- ✅ `body.type` 用于标识消息内容的类型（可选）
- ✅ 使用 `PacketValidator` 工具类进行验证
- ✅ 参考协议文档和示例代码确保正确使用

