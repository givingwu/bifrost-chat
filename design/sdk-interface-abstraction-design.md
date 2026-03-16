# SDK 接口抽象与依赖注入设计（v3.1）

## 1. 目标

通过“接口抽象 + 依赖注入”实现：

- SDK 提供稳定契约与默认组件。
- 调用方提供具体数据实现。
- UI 与请求实现解耦。

## 2. 职责分工

### 2.1 SDK 提供（As-Is）

- 默认组件（ConversationList、InfiniteMessageList、ComposerWithSend 等）
- 服务接口契约（`IConversationService` / `IMessageService` / `ITemplateService`）
- Provider（`ConfigProvider`、`QueryProvider`、`ServiceProvider`、`I18nProvider`）
- 声明式 hooks（query + mutation）

### 2.2 调用方提供（As-Is）

- 服务实现（HTTP/WebSocket/GraphQL 等）
- 鉴权与业务网关
- 协议与 DTO 适配细节

## 3. 服务接口（当前签名）

### 3.1 IConversationService

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

### 3.2 IMessageService

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

### 3.3 ITemplateService

```ts
interface ITemplateService<TListParams = any, TPreviewParams = any> {
  list(params: TListParams): Promise<Template[]>;
  preview(
    params: TPreviewParams,
  ): Promise<{
    previewContent: string;
    params: Record<string, string>;
  }>;
}
```

## 4. 注入机制（As-Is）

`ServiceProvider` 是服务注入入口：

```tsx
<ServiceProvider
  conversationService={conversationServiceImpl}
  messageService={messageServiceImpl}
  templateService={templateServiceImpl}
>
  <ChatContainer>
    <DefaultChatLayout />
  </ChatContainer>
</ServiceProvider>
```

约束：

- SDK 内部 hooks/组件通过 `useServices()` 取服务。
- 组件禁止直接 `fetch/axios`。

## 5. Hooks 与接口关系（As-Is）

- `useConversations` -> `conversationService.list`
- `useCreateConversation` -> `conversationService.create`
- `useMessages` -> `messageService.list`
- `useSendMessage` -> `messageService.send`
- `useMarkAsRead` -> `messageService.markAsRead`
- `useTemplates` -> `templateService.list`

## 6. 目标架构（To-Be）

- 模板链路分拆独立 mutation/query。
- 实时订阅与缓存回灌模型标准化。

## 7. 设计红线

- 公开 API 禁止 `Session` 命名。
- Template 相关类型禁止复用 Profile 类型。
- 服务端实体列表禁止写入 Zustand。
- 对外文档示例必须与真实导出一致。
