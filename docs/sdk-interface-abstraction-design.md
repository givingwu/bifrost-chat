# SDK 接口抽象与依赖注入设计（v3）

## 1. 目标

通过“接口抽象 + 依赖注入”实现：

- SDK 提供稳定契约和默认组件
- 调用方提供具体数据实现
- UI 与请求实现彻底解耦

## 2. 职责分工

### SDK 提供

- 默认组件（ConversationList、ChatMessageList、ComposerToolbar 等）
- 服务接口契约（`IConversationService`/`IMessageService`/`ITemplateService`）
- Provider（`ReactQueryProvider`、`ServiceProvider`、`I18nProvider`）
- 声明式 Hooks（查询 + mutation）

### 调用方提供

- 服务实现类（HTTP/WebSocket/GraphQL 等）
- 请求鉴权与业务网关
- 协议与 DTO 适配细节（若存在）

> 说明：SDK 不约束协议适配与字段转换方案，调用方可自由选择。

## 3. 服务接口

以仓库现有接口为准：

- `src/services/conversation.service.ts`
- `src/services/message.service.ts`
- `src/services/template.service.ts`

核心特征：

- 参数使用泛型，适配不同业务参数结构
- 返回统一 SDK 实体（Conversation / StandardMessage / Template）
- 支持订阅接口（可选）承接实时更新

## 4. 注入机制

`ServiceProvider` 是唯一注入入口：

```tsx
<ServiceProvider
  conversationService={conversationServiceImpl}
  messageService={messageServiceImpl}
  templateService={templateServiceImpl}
>
  <ChatContainer />
</ServiceProvider>
```

约束：

- SDK 内部组件/Hooks 只能通过 `useServices()` 获取服务。
- 组件禁止直接 `fetch/axios`。

## 5. Hooks 与接口关系

- `useConversations` -> `conversationService.list`
- `useCreateConversation` -> `conversationService.create`
- `useMessages` -> `messageService.list`
- `useSendMessage` -> `messageService.send`
- `useMarkAsRead` -> `messageService.markAsRead`
- `useTemplates` -> `templateService.list`

## 6. 最小宿主实现示例

```ts
import type {
  IConversationService,
  IMessageService,
  ITemplateService,
} from '@feoe/bifrost-chat';

export class ConversationServiceImpl
  implements IConversationService<MyListParams, MyCreateParams, MyQueryParams> {
  async list(params?: MyListParams) { /* ... */ }
  async get(conversationId: string) { /* ... */ }
  async create(params: MyCreateParams) { /* ... */ }
  async query(params: MyQueryParams) { /* ... */ }
}

export class MessageServiceImpl
  implements IMessageService<MyListParams, MySendParams, MyReadParams> {
  async list(conversationId: string, params: MyListParams) { /* ... */ }
  async send(conversationId: string, params: MySendParams) { /* ... */ }
  async markAsRead(params: MyReadParams) { /* ... */ }
  subscribeToMessages() { return () => {}; }
  subscribeToMessageStatus() { return () => {}; }
}

export class TemplateServiceImpl
  implements ITemplateService<MyTemplateListParams, MyTemplateSendParams> {
  async list(params: MyTemplateListParams) { /* ... */ }
  async send(params: MyTemplateSendParams) { /* ... */ }
}
```

## 7. 设计红线

- 公开 API 禁止 `Session` 命名。
- Template 相关类型禁止复用 Profile 类型。
- 服务端数据禁止进入 Zustand 长驻。
- SDK 文档与示例必须使用 `@/` 别名风格。
