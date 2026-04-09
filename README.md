# @feoe/bifrost-chat

<div align="center">

<img src="./logo.jpeg" alt="Bifrost-Chat" width="100" />

**全渠道聊天 JS SDK 组件库**

基于 React 与 Tailwind CSS 的可嵌入聊天 SDK。

[更新日志](CHANGELOG.md)
[文档索引](DOCUMENTATION_INDEX.md)

</div>

## 文档

- **📚 完整文档索引**：[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) ⭐
- **🏗️ 架构总览**：`design/README.md`
- **🎯 架构基线（SSOT）**：`design/final-architecture.md`
- **📝 命名规范**：`design/naming-conventions.md`

- 架构总览：`design/README.md`
- 架构基线（SSOT）：`design/final-architecture.md`
- 文档导航：`design/README.md`
- 命名规范：`design/naming-conventions.md`

## 特性

- Conversation 语义统一（公开 API 禁用 Session）
- 接口抽象 + 依赖注入（ServiceProvider）
- React Query（服务端状态）+ Zustand（客户端状态）
- 默认布局组件 + 可替换的组合式组件
- TypeScript 类型完整，支持泛型服务参数
- 内置国际化与主题能力

## 技术栈

- TypeScript
- React 19+
- Tailwind CSS 4+
- @tanstack/react-query
- Zustand
- Rslib
- Vitest
- Biome

## 安装

```bash
pnpm add @feoe/bifrost-chat
# 或
npm install @feoe/bifrost-chat
# 或
yarn add @feoe/bifrost-chat
```

## 快速开始

### 1) 实现服务接口

```tsx
import {
  MessageStatusEnum,
  type Conversation,
  type IConversationService,
  type IMessageService,
  type ITemplateService,
  type MessageStatusUpdate,
  type MessageSendResult,
  type StandardMessage,
  type Template,
} from '@feoe/bifrost-chat';

class MyConversationService implements IConversationService {
  async list() {
    const response = await fetch('/api/conversations');
    return (await response.json()) as Conversation[];
  }

  async get(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}`);
    return (await response.json()) as Conversation | null;
  }

  async create(params: unknown) {
    // 电催新接口：创建会话也统一走 /chat/v2/session/info
    const response = await fetch('/chat/v2/session/info', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Conversation;
  }

  async query(params: unknown) {
    const response = await fetch('/chat/v2/session/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Conversation | null;
  }
}

class MyMessageService implements IMessageService {
  async list(conversationId: string, params: unknown) {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return (await response.json()) as StandardMessage[];
  }

  async send(conversationId: string, params: unknown) {
    // 电催宿主通常在 send 内部先做频次检查，再真正发送
    await fetch('/chat/v2/message/check', {
      method: 'POST',
      body: JSON.stringify({
        chatId: conversationId,
        ...params,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await fetch('/chat/v2/message/send', {
      method: 'POST',
      body: JSON.stringify({
        chatId: conversationId,
        ...params,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as MessageSendResult;
  }

  async markAsRead(params: unknown) {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  subscribeToMessages(_callback: (message: StandardMessage) => void) {
    return () => {};
  }

  subscribeToMessageStatus(_callback: (update: MessageStatusUpdate) => void) {
    return () => {};
  }

  async sendAttachment(params: unknown) {
    const response = await fetch('/api/messages/send-attachment', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as any;
  }

  async sendAudio(params: unknown) {
    const response = await fetch('/api/messages/send-audio', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as any;
  }
}

class MyTemplateService implements ITemplateService {
  async list(params: unknown) {
    const response = await fetch('/chat/v2/template/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Template[];
  }

  async preview(params: {
    conversationId: string;
    currentChannel: string;
    templateCode: string;
  }) {
    const response = await fetch('/chat/v2/template/render', {
      method: 'POST',
      body: JSON.stringify({
        chatId: params.conversationId,
        channelType: params.currentChannel,
        template: params.templateCode,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Template;
  }
}
```

### 2) 组装 Provider 与默认布局

```tsx
import {
  ChannelTypeEnum,
  ChatContainer,
  ConfigProvider,
  DefaultChatLayout,
  type INetworkService,
  LanguageCodeEnum,
  NetworkQualityEnum,
  NetworkReachabilityEnum,
  NetworkStatusEnum,
  QueryProvider,
  ServiceProvider,
} from '@feoe/bifrost-chat';

const conversationService = new MyConversationService();
const messageService = new MyMessageService();
const templateService = new MyTemplateService();
const networkService: INetworkService = {
  getSnapshot: () => ({
    status: NetworkStatusEnum.Connected,
    reachability: NetworkReachabilityEnum.Online,
    quality: NetworkQualityEnum.Good,
    enableStatusIndicator: true,
  }),
  subscribe: () => () => {},
};

export function App() {
  return (
    <ConfigProvider
      config={{
        language: { code: LanguageCodeEnum.ZhCN },
        strategy: {
          allowedChannels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.Email],
          activeChannel: ChannelTypeEnum.WhatsApp,
        },
        composer: {
          // 自定义消息最多 500 字
          customMessageMaxLength: 500,
          // 默认开启：模板消息不受字数限制
          ignoreMaxLengthForTemplateMessages: true,
        },
      }}
    >
      <QueryProvider>
        <ServiceProvider
          conversationService={conversationService}
          messageService={messageService}
          templateService={templateService}
          networkService={networkService}
        >
          <ChatContainer>
            <DefaultChatLayout />
          </ChatContainer>
        </ServiceProvider>
      </QueryProvider>
    </ConfigProvider>
  );
}
```

#### 仅模板输入场景

当业务要求 Composer 默认不可自由输入，只允许通过模板回填内容时，
可以在 `ConfigProvider` 中配置：

```tsx
<ConfigProvider
  config={{
    composer: {
      inputMode: 'template-only',
      placeholder: '请选择模板内容',
      templateMode: 'edit',
      allowTemplateEdit: false,
    },
  }}
>
  {/* ... */}
</ConfigProvider>
```

- `inputMode: 'template-only'`：默认不可自由输入
- `placeholder`：自定义输入框占位文案
- `allowTemplateEdit: false`：模板回填后保持只读
- 用户清空模板后，输入框仍保持不可自由输入状态

### 3) Host 网络关系

**当前已实现（As-Is）**

- `ServiceProvider` 支持可选注入 `networkService`
- SDK 通过 `networkService.getSnapshot()` 和 `subscribe()` 同步 Host
  的网络事实到 Zustand `network` 与 React Query `onlineManager`
- 未注入 `networkService` 时，SDK 默认显示为
  `status: Unknown`、`reachability: Unknown`，且不显示网络状态指示器
- 离线自动同步只依赖 `reachability === Online`
- 发送失败时，只有 `errorType === Network` 或显式 `retryable === true`
  才会进入离线队列

**目标架构（To-Be）**

- Host 继续负责聚合浏览器、HTTP、WebSocket/SSE、宿主生命周期等多源网络事实
- SDK 不自行读取 `navigator.onLine` 作为最终真相
- 后续可在 Host 侧补充更细粒度的网络原因与诊断字段，再通过
  `networkService` 透传给 SDK

### 4) Composer 草稿与离线队列

**当前已实现（As-Is）**

- `composer.customMessageMaxLength` 可配置自定义消息字数上限
- `composer.ignoreMaxLengthForTemplateMessages` 默认 `true`，即模板消息默认不受字数限制
- Composer 草稿按 `conversationId + channel` 做分桶缓存；没有
  `conversationId` 时退化为 `channel` 级缓存
- 旧的 conversation 级草稿 key 会在首次读取时迁移到新的
  channel 级 key
- `clearDraftOnSend` 仅在发送结果为成功终态时清理草稿
- 网络失败或可重试失败会保留离线队列；业务失败、鉴权失败、校验失败不会被当作离线消息
- `draft` 与 `offline queue` 职责分离：前者是输入工作态，后者是待重试发送记录

**目标架构（To-Be）**

- 如需支持“失败消息恢复到输入框”，应通过显式 restore 动作复制
  outbox 消息到 draft，而不是直接 dequeue
- 后续可为 Host 暴露更清晰的 draft / outbox 恢复策略配置，但不合并两类存储职责

## 公开 API（以导出为准）

### 组件

- 组件导出以 `src/components/index.ts` 为准。
- 当前公开范围覆盖基础组件、布局组件、Conversation 组件、消息组件、
  Composer 组件、Template 组件、Profile 组件和 Toolbar 组件。
- `TemplatePicker`、`Tooltip` 不再属于公开导出。

### Hooks

- `useConversations`
- `useCreateConversation`
- `useInViewport`
- `useMarkAsRead`
- `useMessages`
- `useSendMessage`
- `useTemplates`
- `useTotalUnread`
- `useUnreadSync`

### Providers

- `ConfigProvider`、`useConfig`
- `I18nProvider`
- `QueryProvider`、`createQueryClient`、`queryKeys`
- `ServiceProvider`、`useServices`、`createNotImplementedServices`

### 类型与服务接口

- 业务实体与服务接口类型以 `src/index.ts` 为准。
- 当前公开服务接口：`IConversationService`、`IMessageService`、
  `ITemplateService`、`INetworkService`
- `SDKConfig`、`ChatSDK`、`WebSocket*` 相关类型不属于当前公开 API。
  兼容导出除外：历史接入仍可使用 `WebSocketManager`、
  `WebSocketEventTypeEnum`、`PacketConverter`、`MessageBuilder`。

### Store 与工具

- Store：`useChatStore`、`configureChatStore`、`useStrategy`、`useNetwork`、
  `useTheme`、`useLanguage`、`useConversation`、`useProfile`、
  `useComposerConfig`、`useActions`
- 工具：`cn`、`formatTimestamp`、`formatDuration`、`createStorageHelper`、
  `clearSDK`、`MessageBuilder`
- 语言包：`enUSMessages`、`zhCNMessages`

## 内部能力说明（未从包入口导出）

以下能力在仓库内部可用，但不属于当前公开 API：

- `TemplatePicker`
- `Tooltip`
- `SDKConfig` / `ChatSDK`
- `MessageCacheHelper`
- `MessageSyncService`
- `useWebSocket`
- `createWebSocketMessageHandler`
- `useTranslation`

兼容迁移说明：

- `clearSDK()` 已恢复导出，用于兼容既有接入方。
- 协议/实时层兼容导出已恢复：`PacketConverter`、`WebSocketManager`、
  `WebSocketEventTypeEnum`、`MessageBuilder`。
- 新代码建议显式调用 `resetChatStore()` +
  `clearQueryCache(queryClient)`，只在需要清理本地持久化状态时再传
  `clearStorage: true`。
- `clearStorage: true` 会清理旧版草稿 key 和当前按 channel 分桶的草稿 key。
- 如宿主同时传入 `offlineMessageQueue`，`clearSDK()` 也会一并清理离线消息队列。

如需对外开放，建议先在 `design/final-architecture.md` 中完成设计评审。

## 样式

默认会自动注入基础样式。你也可以按需引入：

```tsx
import '@feoe/bifrost-chat/styles';
import '@feoe/bifrost-chat/styles/theme';
```

## 开发命令

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run test
pnpm run check
pnpm run format
pnpm run storybook
```

## 反馈

- 需求与问题：仓库 issue（见 package.json 中 `bugs.url`）
- 架构口径冲突：请先对齐 `design/final-architecture.md`

## 许可证

[MIT](LICENSE) © FEOF
