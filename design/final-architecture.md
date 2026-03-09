# Bifrost-Chat JS SDK 最终架构基线（v3.1）

> 本文档是 SDK 架构的单一事实源（SSOT）。

## 版本信息

- 版本：3.1.0
- 状态：生效中
- 更新日期：2026-03-09

## 1. 不可变决策

1. 公开 API 禁用 `Session`，统一使用 `Conversation`。
2. SDK 形态固定为：接口契约 + DI Provider + 默认组件。
3. 服务端状态归 React Query；客户端交互状态归 Zustand。
4. Template 与 Profile 职责分离，不做类型耦合。
5. 对外文档以公开导出为准，不暴露未导出能力为官方 API。

## 2. 当前已实现（As-Is）

### 2.1 公开导出边界

以 `src/index.ts` 与 `src/components/index.ts` 为准。

- 对外公开组件：`Topbar`、`AudioMessage`、`TemplatePanel` 等。
- 对外公开 Hooks：
  `useConversations`、`useCreateConversation`、`useInViewport`、
  `useMarkAsRead`、`useMessages`、`useSendMessage`、`useTemplates`、
  `useTotalUnread`、`useUnreadSync`。
- 对外公开 Providers：
  `ConfigProvider`、`I18nProvider`、`QueryProvider`、`ServiceProvider`。
- 对外公开服务接口：
  `IConversationService`、`IMessageService`、`ITemplateService`、
  `INetworkService`。
- 对外公开兼容清理入口：
  `clearSDK`（兼容 API，推荐新代码改用 `resetChatStore` +
  `clearQueryCache` 组合）。
- 对外公开兼容协议/实时能力：
  `MessageBuilder`、`PacketConverter`、`WebSocketManager`、
  `WebSocketEventTypeEnum` 及相关 WebSocket 类型。

未从包入口公开（仅仓库内部能力）：

- `TemplatePicker`
- `Tooltip`
- `SDKConfig` / `ChatSDK`
- `MessageCacheHelper`
- `MessageSyncService`
- `useWebSocket`
- `createWebSocketMessageHandler`
- `useTranslation`

### 2.2 状态边界事实表

| 范畴 | 当前实现 | 说明 |
|---|---|---|
| 会话/消息/模板列表 | React Query | 由 `useConversations/useMessages/useTemplates` 管理 |
| 会话选择与搜索 | Zustand | `conversation.slice.ts` |
| 渠道策略与激活渠道 | Zustand | `strategy.slice.ts` |
| 主题/语言/网络 | Zustand | `theme/language/network` slices |
| Composer 功能配置 | Zustand | `composer.slice.ts` |
| 客户画像上下文 | Zustand | `profile.slice.ts` |
| 会话未读展示数 | React Query | 单一事实源为 `Conversation.unreadCount` |

### 2.3 未读数量路径

当前默认布局与公开 Hook 中：

- `Conversation.unreadCount` 是唯一展示值。
- `useUnreadSync` 负责把实时消息事件回灌到 React Query 会话缓存。
- 进入会话时立即把对应会话 `unreadCount` 置为 `0`。
- 若宿主实现 `subscribeToListUpdates` / `subscribeToConversationUpdates`，
  SDK 会将其作为权威回灌源覆盖本地 optimistic unread。

说明：

- 这是当前已实现（As-Is）。
- 未读不再由 Zustand 维护，也不再做 UI 层 merge。

### 2.4 模板发送路径

当前默认布局中：

- `TemplatePanel` 通过 `onTemplateSelect` 回调触发
  `useSendMessage().mutateAsync`。
- 发送参数通过 `extra` 透传模板字段。

说明：

- 这是当前可运行实现。
- 独立的 template mutation 是目标演进项，不是当前公开 API。

### 2.5 QueryKey 事实

当前统一通过 `queryKeys` 生成：

- `conversations.*`
- `messages.*`
- `templates.*`

禁止公开出现 `sessions` 键前缀。

### 2.6 错误模型事实

当前错误类型（`src/interfaces/error.interface.ts`）：

- `SDKError`
- `HTTPError`
- `ValidationError`
- `AuthorizationError`
- `ConfigurationError`
- `NotImplementedError`
- `MapperError`

## 3. 目标架构（To-Be）

以下为目标方向，均需按阶段落地：

1. 模板链路独立 mutation（`useSendTemplateMessage`）与预览 query。
2. 更完善的实时回灌标准（统一事件入缓存策略）。
3. 渠道策略矩阵（不同渠道输入能力差异）完整化。
4. 未读的权威来源进一步标准化，优先由宿主会话实时订阅统一提供。

落地约束：

- 不破坏现有公开 API。
- 优先通过新增能力演进，避免破坏性重命名。

## 4. 分层结构

```mermaid
graph TB
    subgraph Host[宿主应用]
      HS1[ConversationServiceImpl]
      HS2[MessageServiceImpl]
      HS3[TemplateServiceImpl]
    end

    subgraph SDK[Bifrost-Chat SDK]
      subgraph Contracts[契约层]
        I1[IConversationService]
        I2[IMessageService]
        I3[ITemplateService]
      end

      subgraph Providers[Provider层]
        P0[ConfigProvider]
        P1[QueryProvider]
        P2[ServiceProvider]
        P3[I18nProvider]
      end

      subgraph Hooks[声明式 Hooks]
        H1[useConversations]
        H2[useMessages]
        H3[useTemplates]
        H4[useSendMessage]
      end

      subgraph UI[默认组件]
        C1[DefaultChatLayout]
        C2[ConversationList]
        C3[InfiniteMessageList]
        C4[ComposerWithSend]
        C5[TemplatePanel]
      end

      subgraph Store[Zustand 客户端状态]
        Z1[strategy]
        Z2[conversation]
        Z3[theme/language/network]
        Z4[profile/composer]
      end
    end

    HS1 -.注入.-> P2
    HS2 -.注入.-> P2
    HS3 -.注入.-> P2

    C1 --> H1
    C1 --> H4
    C1 --> H3
    C3 --> H2

    H1 --> P1
    H2 --> P1
    H3 --> P1
    H4 --> P1

    C1 --> Z1
    C1 --> Z2
    C1 --> Z4
```

## 5. 接口与 DI 基线

### 5.1 会话接口

```ts
interface IConversationService<
  TListParams = any,
  TCreateParams = any,
  TQueryParams = any,
> {
  list(params?: TListParams): Promise<Conversation[]>;
  get(conversationId: string): Promise<Conversation | null>;
  create(params: TCreateParams): Promise<Conversation>;
  query(params: TQueryParams): Promise<Conversation | null>;
}
```

### 5.2 消息接口

```ts
interface IMessageService<
  TListParams = any,
  TSendParams = any,
  TReadParams = any,
  TAttachmentParams = any,
  TAudioParams = any,
> {
  list(conversationId: string, params: TListParams): Promise<StandardMessage[]>;
  send(conversationId: string, params: TSendParams): Promise<MessageSendResult>;
  markAsRead(params: TReadParams): Promise<void>;
  subscribeToMessages(callback: (message: StandardMessage) => void): () => void;
  subscribeToMessageStatus(callback: (update: MessageStatusUpdate) => void): () => void;
  sendAttachment(params: TAttachmentParams): Promise<SendAttachmentResult>;
  sendAudio(params: TAudioParams): Promise<SendAudioResult>;
}
```

### 5.3 模板接口

```ts
interface ITemplateService<TListParams = any, TSendParams = any> {
  list(params: TListParams): Promise<Template[]>;
  send(params: TSendParams): Promise<MessageSendResult>;
  preview?(templateId: string, variables: Record<string, string>): Promise<string>;
}
```

### 5.4 注入方式

```tsx
<QueryProvider>
  <ServiceProvider
    conversationService={conversationServiceImpl}
    messageService={messageServiceImpl}
    templateService={templateServiceImpl}
  >
    <ChatContainer>
      <DefaultChatLayout />
    </ChatContainer>
  </ServiceProvider>
</QueryProvider>
```

## 6. 对调用方的边界声明

调用方负责：

- API 请求与鉴权。
- 协议适配、DTO 转换。
- 实时订阅实现细节。
- 业务重试、审计、限流。

SDK 不负责：

- 绑定特定后端协议。
- 规定调用方适配层目录结构。
- 宿主业务规则实现。

## 7. 迁移优先级

1. 公开文档口径全面对齐当前导出。
2. 模板发送链路独立 mutation 化（向后兼容）。
3. 实时能力标准化并决定是否公开导出。
4. 渠道能力矩阵与 Composer 策略闭环。
