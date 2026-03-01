# 快速开始

## 当前已实现（As-Is）

- SDK 公开术语统一使用 `Conversation`（禁止公开 `Session` 命名）。
- 接入方式采用依赖注入：
  - `ServiceProvider` 注入服务实现
  - `QueryProvider` 承载 React Query
  - `ConfigProvider` 初始化 Zustand 客户端配置
  - `ChatContainer` + `DefaultChatLayout` 负责默认渲染

## 目标架构（To-Be）

- 模板发送/预览演进为独立 query/mutation。
- 渠道策略矩阵持续完善（互斥规则、能力约束）。

## 安装

```bash
pnpm add @feoe/bifrost-chat
```

## 1) 实现服务接口

```tsx
import type {
  Conversation,
  IConversationService,
  IMessageService,
  ITemplateService,
  MessageSendResult,
  StandardMessage,
  Template,
} from '@feoe/bifrost-chat';

const conversationService: IConversationService = {
  async list() {
    const res = await fetch('/api/conversations');
    return (await res.json()) as Conversation[];
  },
  async get(conversationId) {
    const res = await fetch(`/api/conversations/${conversationId}`);
    return (await res.json()) as Conversation | null;
  },
  async create(params) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Conversation;
  },
  async query(params) {
    const res = await fetch('/api/conversations/query', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Conversation | null;
  },
};

const messageService: IMessageService = {
  async list(conversationId, params) {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as StandardMessage[];
  },
  async send(conversationId, params) {
    const res = await fetch(
      `/api/conversations/${conversationId}/messages/send`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return (await res.json()) as MessageSendResult;
  },
  async markAsRead(params) {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
  },
  subscribeToMessages(_callback) {
    return () => {};
  },
  subscribeToMessageStatus(_callback) {
    return () => {};
  },
  async sendAttachment() {
    throw new Error('请在宿主应用实现附件上传与发送逻辑');
  },
  async sendAudio() {
    throw new Error('请在宿主应用实现音频上传与发送逻辑');
  },
};

const templateService: ITemplateService = {
  async list(params) {
    const res = await fetch('/api/templates/list', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as Template[];
  },
  async send(params) {
    const res = await fetch('/api/templates/send', {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' },
    });
    return (await res.json()) as MessageSendResult;
  },
  async preview(templateId, variables) {
    const res = await fetch(`/api/templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify(variables),
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.text();
  },
};
```

## 2) 组装 Provider 与默认布局

```tsx
import {
  ChannelTypeEnum,
  ChatContainer,
  ConfigProvider,
  DefaultChatLayout,
  LanguageCodeEnum,
  QueryProvider,
  ServiceProvider,
} from '@feoe/bifrost-chat';

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
          enableDraft: true,
          enableAttachments: true,
          enableAudioInput: true,
          showEmojiButton: true,
        },
      }}
    >
      <QueryProvider>
        <ServiceProvider
          conversationService={conversationService}
          messageService={messageService}
          templateService={templateService}
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

## 3) 术语兼容说明

- SDK 公开 API 统一使用 `Conversation` / `conversationId`。
- 协议层文档中的 `chatId`、`session` 为历史兼容字段，不作为 SDK 公开命名。

## 下一步

- [安装指南](/guide/installation)
- [架构基线](/guide/architecture-baseline)
- [ACK 机制](/guide/ack-mechanism)
