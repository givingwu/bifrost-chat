# @feoe/bifrost-chat

<div align="center">

<img src="./logo.jpeg" alt="Bifrost-Chat" width="100" />

**全渠道聊天 JS SDK 组件库**

基于 React 与 Tailwind CSS 的可嵌入聊天 SDK。

[更新日志](CHANGELOG.md)

</div>

## 文档

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
    const response = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Conversation;
  }

  async query(params: unknown) {
    const response = await fetch('/api/conversations/query', {
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
    const response = await fetch(
      `/api/conversations/${conversationId}/messages/send`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
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
    const response = await fetch('/api/templates/list', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as Template[];
  }

  async send(params: unknown) {
    const response = await fetch('/api/templates/send', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.json()) as MessageSendResult;
  }

  async preview(templateId: string, variables: Record<string, string>) {
    const response = await fetch(`/api/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify(variables),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await response.text()) as string;
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

## 公开 API（以导出为准）

### 组件

- 基础：`Avatar`、`Button`、`IconButton`、`Image`、`SearchInput`
- 布局：`ChatContainer`、`ChatLayout`、`DefaultChatLayout`
- 会话：`ConversationList`、`ConversationItem`、`ConversationHeader`、
  `ConversationAvatar`、`ConversationPanel`
- 消息：`MessageList`、`InfiniteMessageList`、`MessageBubble`、
  `MessageRendererFactory`、`MessageContentRenderer`、`MessageTimestamp`、
  `StatusIndicator`、`TextMessage`、`ImageMessage`、`AudioMessage`、
  `VideoMessage`、`FileMessage`、`LocationMessage`、`RichMediaMessage`、
  `WhatsAppMessage`、`UnsupportedMessage`
- 输入区：`ComposerInput`、`ComposerActions`、`ComposerAttachments`、
  `ComposerToolbar`、`ComposerWithSend`、`AttachmentPreview`、`ComposerHint`、
  `EmojiPicker`、`MentionPicker`、`TemplatePicker`
- 模板：`TemplateHeader`、`TemplateCategoryButton`、`TemplateSearch`、
  `TemplateList`、`TemplatePanel`
- 画像：`Profile`、`ProfileHeader`、`ProfileInfoList`、`ProfileSectionTitle`
- 工具栏：`Topbar`、`TopbarTools`、`ChannelBadge`、`ChannelButtonFactory`、
  `ChannelFilter`、`LanguageSwitcher`、`ThemeSwitcher`、`NetworkStatus`
- 状态反馈：`LoadingState`、`EmptyState`、`ErrorState`

### Hooks

- `useComposerDraft`
- `useComposerShortcuts`
- `useConversations`
- `useCreateConversation`
- `useMarkAsRead`
- `useMessages`
- `useSendMessage`
- `useTotalUnread`
- `useTemplates`
- `useUnreadSync`

### Providers

- `ConfigProvider`、`useConfig`
- `I18nProvider`
- `QueryProvider`、`createQueryClient`、`queryKeys`
- `ServiceProvider`、`useServices`、`createNotImplementedServices`

### 类型与服务接口

- 全部导出的接口定义见：
  `src/interfaces/*.interface.ts`
- 服务接口：
  `IConversationService`、`IMessageService`、`ITemplateService`

### Store 与工具

- Store：`useChatStore`、`configureChatStore`、`useStrategy`、`useNetwork`、
  `useTheme`、`useLanguage`、`useConversation`、`useProfile`、
  `useComposerConfig`、`useActions`
- 工具：`cn`、`MessageBuilder`、`formatTimestamp`
- 语言包：`enUSMessages`、`zhCNMessages`

## 内部能力说明（未从包入口导出）

以下能力在仓库内部可用，但不属于当前公开 API：

- `useWebSocket`
- `createWebSocketMessageHandler`
- `useTranslation`

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
