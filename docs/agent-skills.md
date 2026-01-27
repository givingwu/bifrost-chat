# Bifrost-Chat Agent Skills

> 面向 Agent（类似 Claude-Code）使用的技能说明与执行约束，聚焦 Bifrost-Chat JS SDK 架构与模块化落地。

## 1. 目标与职责

- 提供 Bifrost-Chat JS SDK 的架构认知与模块拆分指引。
- 保持 SDK 可维护性、扩展性与性能基线（虚拟化、分层解耦）。
- 在不破坏现有公共 API 的前提下扩展渠道、消息类型、协议。

## 2. 核心能力域

### 2.1 UI 渲染与交互

- ChannelToolsList（策略驱动渲染渠道按钮，in_call 互斥）。
- ChatMessageList（虚拟列表 + MessageFactory）。
- Composer Strategy（SMS/WhatsApp/Email 输入能力策略切换）。
- ContextPanel（Profile/Templates/Other + 模板注入输入框）。
- UI 原则：Container/Presentational 分离、长列表虚拟化。

### 2.2 状态与事件

- ClientBus 为 Host ↔ SDK 的唯一入口。
- Store（Zustand Slice）：UI / Strategy / Conversation / Context。
- 单向数据流：Host → Action → Store → UI。

### 2.3 消息处理

- 标准消息体 StandardMessage（包含 tempId/realId、status、type）。
- 乐观更新 + 失败重试（sending/failed/resend）。
- 多态渲染：MessageContentType 映射 Bubble 组件。

### 2.4 DataLayer 与 Adapter

- Repository 屏蔽数据访问细节（Facade）。
- Offline Queue：断网入队、恢复自动重发。
- AdapterFactory + Mapper（Zod 校验 + DTO 映射）。
- 能力接口拆分：ITextSender / IMediaSender / IInteractionReporter。

### 2.5 NetLayer

- INetwork 抽象（connect/disconnect/send/on/off/isConnected）。
- Protocol Switcher（Socket/SSE/Polling）。
- Connection Manager（心跳 + 重连）。

### 2.6 后端组件认知（Bifrost）

- Heimdall：长连接维护、心跳、认证、连接位置存储。
- Hugin：消息协议解析、路由、限流/降级、线程池隔离。
- Hermod：推送执行、ACK、重试、消息状态维护、异步存储。

## 3. SDK 关键接口清单

```ts
export interface SDKContext {
  sessionId: string;
  customerToken: string;
  hostUser: { id: string; name: string };
  initialStrategy?: { allowedChannels: ChannelType[] };
}

export interface IChatSDK {
  init(config: { endpoint: string; debug?: boolean }): Promise<boolean>;
  destroy(): void;
  openContext(context: SDKContext): Promise<void>;
  closeContext(): void;
  on(event: 'message_received', callback: (msg: StandardMessage) => void): void;
  on(event: 'incoming_call', callback: (data: unknown) => void): void;
  emit(action: 'make_call', params: { phone: string }): void;
}

export interface StandardMessage {
  id: string;
  tempId?: string;
  direction: 'inbound' | 'outbound';
  channelType: ChannelType;
  status: MessageStatus;
  timestamp: number;
  type: MessageContentType;
  content: MessageContent;
  metadata?: Record<string, unknown>;
}
```

## 4. 设计模式与原则

- Factory：MessageFactory/AdapterFactory。
- Strategy：Protocol Switcher/Composer Strategy。
- Adapter/Repository/Facade/Observer/Singleton。
- SOLID + Anti-Corruption Layer（Zod Schema 校验）。

## 5. 模块映射（建议目录）

- `src/components/toolbar`：ChannelToolsList + ChannelButtonFactory
- `src/components/messages`：ChatMessageList + MessageRendererFactory + BubbleMap
- `src/components/composer`：ComposerStrategy
- `src/components/context`：ContextPanel
- `src/store`：UI/Strategy/Conversation/Context Slices
- `src/datalayer`：Repository + OfflineQueue + Retry
- `src/adapter`：SMSAdapter / WhatsAppAdapter / EmailAdapter / VoIPAdapter
- `src/mapper`：各渠道 Mapper + Zod Schema
- `src/netlayer`：INetwork + ProtocolSwitcher + Transport Implementations

## 6. 执行约束

- 不修改既有公共 API 类型与事件名。
- 新增渠道/消息类型必须通过 Adapter + Mapper + Factory 注册。
- 长列表必须使用虚拟滚动方案。
- 数据进入 Store 前必须通过 Mapper + Zod 校验。

## 7. 质量与测试

- 新增能力需补充/更新 Vitest 测试。
- 关键流程：发送/接收/重试/策略切换必须可断言。
- 运行 lint/format 保障一致性。