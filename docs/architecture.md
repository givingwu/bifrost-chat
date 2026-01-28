# Bifrost-Chat 架构设计

> 本文基于 specs 与 docs 汇总整理，补齐协议到 SDK 模型与流程的映射，作为 SDK 架构的单一事实源（SSOT）。

## 1. 目标与边界

- **目标**：统一前端接入形态、屏蔽渠道/协议差异、确保可维护性与可扩展性。
- **边界**：不改变既有 SDK 公共 API；新增能力必须走 Adapter + Mapper + Factory。
- **非目标**：不承担业务系统规则，不强依赖后端实现细节。

## 2. 分层架构（SDK 侧）

### 2.1 UI 渲染层

- **ChatContainer**：SDK 根容器，提供 I18n/Theme，承载顶部工具栏。
- **ChatTopbar**：顶部栏，左侧渠道工具，右侧网络状态与主题切换。
- **NetworkStatus**：网络连接状态展示（connected/disconnected/connecting）。
- **ThemeSwitcher**：主题切换（system/light/dark）。
- **LanguageSwitcher**：语言切换（en-US/zh-CN），未传入语言时使用浏览器语言。
- **ChannelToolsList**：根据 `strategy.allowedChannels` 渲染按钮，`in_call` 互斥。
- **ChatMessageList**：虚拟列表 + MessageFactory（消息类型到 Bubble 组件映射）。
- **Composer Strategy**：SMS/WhatsApp/Email 输入能力按策略切换。
- **ContextPanel**：Profile/Templates/Other，模板可一键注入输入框。
- **原则**：Container/Presentational 分离，长列表必须虚拟化（react-window/react-virtuoso）。

### 2.2 交互与状态层（ClientBus & Store）

- **ClientBus**：Host ↔ SDK 唯一入口。
- **SDK API**：`init/destroy/openContext/closeContext/on/emit`。
- **Store (Zustand)**：UI/Strategy/Network/Theme/Language/Conversation/Context Slice。
- **单向数据流**：Host → Action → Store → UI。

### 2.3 调度与缓存层（DataLayer）

- **Repository**：隔离业务逻辑与数据访问细节。
- **Optimistic UI**：先写入 Store，再等待网络回执。
- **Offline Queue**：断网入队，恢复自动重发。
- **去重策略**：短时间重复文本合并，避免重复投递。

### 2.4 渠道适配与翻译层（ChannelAdapter & DataMapper）

- Adapter 负责渠道能力实现（SMS/WhatsApp/Email/VoIP）。
- AdapterFactory 通过 `channelType` 选择实现。
- Mapper 通过 Zod 校验 + DTO 映射，阻断脏数据进入 Store。
- 能力接口拆分：`ITextSender` / `IMediaSender` / `IInteractionReporter`。

### 2.5 网络基建层（NetLayer）

- **INetwork 抽象**：`connect/disconnect/send/on/off/isConnected`。
- **Protocol Switcher**：Socket/SSE/Polling 动态切换。
- **Connection Manager**：心跳 + 重连 + 连接状态监控。

## 3. 后端系统架构（Bifrost）

- **Heimdall**：长连接、心跳、认证、连接位置存储。
- **Hugin**：协议解析、路由、多租户校验、限流/降级。
- **Hermod**：投递执行、ACK/重试、消息状态维护、异步存储。

## 4. 协议与 SDK 模型映射

### 4.1 Packet 标准消息体 → StandardMessage

| 协议字段 | SDK 字段 | 说明 |
| --- | --- | --- |
| `id` | `tempId` | 客户端生成的临时 ID（发送侧）。 |
| `mid` | `id` | 服务端生成的真实 ID（回执后写入）。 |
| `upid` | `metadata.upid` | 上一条消息 ID。 |
| `from`/`to` | `sender/receiver` | 标准化发送者/接收者字段。 |
| `from`/`to` | `metadata.from/to` | 保留原始协议字段，便于追溯。 |
| `ptype` | `metadata.ptype` | 与 `type` 区分，保留协议原始类型。 |
| `body.type` | `type` | 与 `MessageContentType` 对齐。 |
| `body.content` | `content` | 统一内容结构。 |
| `timestamp` | `timestamp` | 服务端时间戳。 |

> 发送侧：创建 `tempId`，当收到 `mid` 后完成 `tempId -> id` 绑定与状态更新。

#### StandardMessage 推荐结构（补充）

```ts
export interface StandardMessage {
  id: string;
  tempId?: string;
  direction: 'inbound' | 'outbound';
  channelType: ChannelType;
  status: MessageStatus;
  timestamp: number;
  type: MessageContentType;
  content: MessageContent;
  sender?: { id: string; name: string; clientType?: string };
  receiver?: { id: string; name: string; clientType?: string };
  metadata?: Record<string, unknown>;
}
```

- `sender/receiver` 是 SDK 内部标准化字段，适配 UI/业务逻辑。
- 原始协议 `from/to` 保留在 `metadata`，避免核心模型被协议细节污染。

### 4.2 ACK 协议 → 消息状态

- `msg_receive_ack`：更新为 `delivered`。
- `msg_read_ack`：更新为 `read`。
- ACK 仅由 Adapter/Mapper 解析，Store 只接收标准化状态更新事件。

### 4.3 心跳协议 → 连接状态

- `client_heartbeat` 上行由 Connection Manager 定时发送。
- 收到 ACK 视为连接健康，更新 `net.status = connected`。
- 超时未收到 ACK 触发重连策略。

### 4.4 会话列表协议 → ConversationList

- `sid` → `conversation.id`。
- `newUnreadCount` → `conversation.hasUnread`。
- `lastMessage`（Packet）→ 经过 Mapper 转成 `StandardMessage`。

## 5. 关键流程

### 5.1 Outbound（发送）

1. UI 触发发送 → Store 生成 `tempId` 并渲染（Optimistic）。
2. DataLayer 选择 Adapter → Mapper → NetLayer。
3. 服务端回执 `mid` 或 ACK → Store 更新 `id/status`。

### 5.2 Inbound（接收）

1. Server → NetLayer → Adapter → Mapper 校验。
2. DataLayer 生成 `StandardMessage` 并写入 Store。
3. UI 被动刷新，并向 Host 触发 `message_received`。

### 5.3 状态同步

- ACK 更新消息状态；失败重试走 Offline Queue。
- 断网期间消息入队，恢复后按顺序重放。

## 6. 关键设计模式与约束

- Factory：MessageFactory/AdapterFactory。
- Strategy：Protocol Switcher/Composer Strategy。
- Adapter + Facade + Repository：隔离渠道与业务。
- 数据进入 Store 前必须通过 Mapper + Zod 校验。
- 新增渠道/消息类型必须走 Adapter + Mapper + Factory 注册。

## 7. 技术栈与依赖

- React + Zustand
- Tailwind CSS
- Virtual Scroll：react-window / react-virtuoso
- Zod + dayjs
- Icons：@ant-design/icons / lucide-react

## 8. 扩展与质量保障

- **扩展**：新增渠道 = 新 Adapter + Mapper + Factory 注册。
- **可替换**：NetLayer 可在 Socket/SSE/Polling 之间热切换。
- **测试**：发送/接收/ACK/重试/策略切换需有 Vitest 覆盖。
- **一致性**：遵循现有命名与目录规范，防止破坏公共 API。