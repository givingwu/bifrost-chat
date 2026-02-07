# @feoe/bifrost-chat

<div align="center">

<img src="./logo.jpeg" alt="Bifrost-Chat" width="100" />

**全渠道聊天 JS SDK 组件库**

基于 React 和 Tailwind CSS 的现代化聊天组件库

[![npm version](https://img.shields.io/npm/v/@feoe/bifrost-chat)](https://www.npmjs.com/package/@feoe/bifrost-chat)
[![license](https://img.shields.io/npm/l/@feoe/bifrost-chat)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

[文档](#文档) ·
[示例](#使用示例) ·
[Storybook](#storybook) ·
[更新日志](CHANGELOG.md)

</div>

## 特性

- 🎨 **现代化 UI** - 基于 Apple Design 风格
- 🌍 **国际化** - 支持中英文
- 🎭 **主题系统** - 3 种内置主题（浅色/深色/跟随系统）
- 📱 **响应式** - 完美适配各种设备
- 🔧 **TypeScript** - 完整的类型定义
- ⚡ **高性能** - 基于 React Query + Zustand 状态管理
- 🎯 **易用性** - 简单的 API 设计,开箱即用
- 🧩 **模块化** - 支持按需引入
- 🔄 **全渠道** - 支持 WhatsApp、SMS、Email 等多种渠道
- 🔌 **接口抽象** - 支持自定义服务实现
- 🎭 **泛型支持** - 支持不同业务方的 API 参数

## 技术栈

- **语言**: TypeScript
- **框架**: React 19+
- **样式**: Tailwind CSS 4+
- **状态管理**: Zustand（客户端状态）+ React Query（服务端状态）
- **构建工具**: Rslib
- **测试**: Vitest
- **代码规范**: Biome
- **组件文档**: Storybook

## 架构

### 设计文档

- [全渠道对话 JS SDK 设计](https://kylith.atlassian.net/wiki/spaces/FrontEnd/blog/344856321/JS+SDK+Omni-channel+Chat+JS+SDK+Design)
- [Bifrost-Chat JS SDK 详细设计](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/395313841/Bifrost-Chat+JSSDK)

### 设计稿

- [Apple Design Style](https://www.figma.com/make/zK4Inbqsjj7GgzD83FVUGI/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-Apple-Design?t=7XJm5o2dqk82QvGD-20&fullscreen=1)
- [Ant-Design Style](https://www.figma.com/make/JLzdL2qNFbazUvXq06m4EZ/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-Ant-Design?p=f&t=21pdeAFGyKHPuHrI-0&fullscreen=1)
- [ShadCN style](https://www.figma.com/make/pVoNt73mBawf4ePMOUfa9G/%E5%85%A8%E6%B8%A0%E9%81%93%E8%81%8A%E5%A4%A9%E7%AA%97%E5%8F%A3%E8%AE%BE%E8%AE%A1-ShadCN-style?p=f&t=fT4tGEa2zaty5ELt-0&fullscreen=1)

#### 相关生态

- [Bifrost](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/384892985/Bifrost)
  - [Bifrost-Heimdall](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392692157/Bifrost-Heimdall)
  - [Bifrost-Hugin](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392299260/Bifrost-Hugin)
  - [Bifrost-Hermod](https://kylith.atlassian.net/wiki/spaces/m78rqGL1Q4UV/pages/392561381/Bifrost-Hermod)
- [更新日志](CHANGELOG.md)
- [问题反馈](https://github.com/feoe/Bifrost-Chat/issues)

## 安装

```bash
npm install @feoe/bifrost-chat
# 或
pnpm add @feoe/bifrost-chat
# 或
yarn add @feoe/bifrost-chat
```

## 快速开始

### 基础使用

```tsx
import React from 'react';
import { ChatContainer, DefaultChatLayout } from '@feoe/bifrost-chat';

function App() {
  return (
    <ChatContainer locale="zh-CN">
      <DefaultChatLayout />
    </ChatContainer>
  );
}

export default App;
```

### 自定义布局

```tsx
import React from 'react';
import {
  ChatContainer,
  ChatLayout,
  ChatTopbar,
} from '@feoe/bifrost-chat';

function CustomChat() {
  return (
    <ChatContainer locale="zh-CN">
      <ChatLayout
        topbar={<ChatTopbar title="聊天窗口" subtitle="在线" />}
        conversationPanel={<div>会话列表</div>}
        composer={<div>输入框</div>}
        profilePanel={<div>用户画像</div>}
      >
        <div>消息列表</div>
      </ChatLayout>
    </ChatContainer>
  );
}

export default CustomChat;
```

### 按需引入组件

```tsx
import { MessageBubble, TextMessage } from '@feoe/bifrost-chat';
```

### 高级用法：依赖注入 + React Query

SDK 采用依赖注入模式，您需要提供具体的服务实现：

```tsx
import React from 'react';
import {
  QueryProvider,
  ServiceProvider,
  IConversationService,
  IMessageService,
  ITemplateService,
} from '@feoe/bifrost-chat';

// 1. 实现服务接口
class MyConversationService implements IConversationService {
  async list() {
    const response = await fetch('/api/conversations');
    return response.json();
  }

  async get(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}`);
    return response.json();
  }

  async create(params) {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async query(params) {
    // 实现查询逻辑
    return null;
  }
}

class MyMessageService implements IMessageService {
  async list(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    const data = await response.json();
    return data.messages;
  }

  async send(conversationId: string, params) {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async markAsRead(params) {
    await fetch('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  subscribeToMessages(callback) {
    // 实现 WebSocket 订阅
    return () => {};
  }

  subscribeToMessageStatus(callback) {
    // 实现状态订阅
    return () => {};
  }
}

class MyTemplateService implements ITemplateService {
  async list() {
    const response = await fetch('/api/templates');
    return response.json();
  }

  async send(params) {
    const response = await fetch('/api/templates/send', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async preview(params) {
    const response = await fetch('/api/templates/preview', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }
}

// 2. 创建服务实例
const conversationService = new MyConversationService();
const messageService = new MyMessageService();
const templateService = new MyTemplateService();

// 3. 使用 Provider 包装应用
function App() {
  return (
    <QueryProvider>
      <ServiceProvider
        conversationService={conversationService}
        messageService={messageService}
        templateService={templateService}
      >
        <ChatContainer locale="zh-CN">
          <DefaultChatLayout />
        </ChatContainer>
      </ServiceProvider>
    </QueryProvider>
  );
}

export default App;
```

### WebSocket 实时通信

SDK 提供了 WebSocket 集成支持，可实现实时消息推送：

```tsx
import { useWebSocket } from '@feoe/bifrost-chat';
import { createWebSocketMessageHandler } from '@feoe/bifrost-chat';
import { useQueryClient } from '@tanstack/react-query';

function ChatApp() {
  const queryClient = useQueryClient();

  useWebSocket({
    url: 'wss://api.example.com/ws',
    token: 'your-auth-token',
    autoConnect: true,
    onMessage: createWebSocketMessageHandler(queryClient),
  });

  return <ChatContainer>...</ChatContainer>;
}
```

## 组件列表

### 布局组件
- `ChatContainer` - 聊天容器（包含 I18nProvider）
- `ChatLayout` - 聊天布局
- `ChatTopbar` - 顶部工具栏
- `DefaultChatLayout` - 默认聊天布局（开箱即用，内置数据获取）

### 消息组件
- `MessageList` - 消息列表（推荐使用）
- `InfiniteMessageList` - 无限滚动消息列表
- `MessageBubble` - 消息气泡
- `MessageContentRenderer` - 消息内容渲染器
- `MessageRendererFactory` - 消息渲染工厂
- `TextMessage` - 文本消息
- `ImageMessage` - 图片消息
- `VideoMessage` - 视频消息
- `VoiceMessage` - 语音消息
- `FileMessage` - 文件消息
- `LocationMessage` - 位置消息
- `RichMediaMessage` - 富媒体消息
- `WhatsAppMessage` - WhatsApp 消息
- `UnsupportedMessage` - 不支持的消息
- `MessageTimestamp` - 消息时间戳
- `StatusIndicator` - 状态指示器

### 输入组件
- `ComposerInput` - 输入框
- `ComposerActions` - 输入操作按钮
- `ComposerToolbar` - 输入工具栏
- `ComposerWithSend` - 带发送功能的输入工具栏（推荐）
- `ComposerAttachments` - 附件预览
- `AttachmentPreview` - 附件预览项
- `ComposerHint` - 输入提示
- `EmojiPicker` - 表情选择器
- `MentionPicker` - 提及选择器
- `TemplatePicker` - 模板选择器

### 会话组件
- `ConversationList` - 会话列表（内置数据获取）
- `ConversationItem` - 会话项
- `ConversationHeader` - 会话头部
- `ConversationAvatar` - 会话头像
- `ConversationPanel` - 会话面板

### 工具栏组件
- `ChannelButtonFactory` - 渠道按钮工厂
- `ChannelBadge` - 渠道徽章
- `ChannelFilter` - 渠道过滤器
- `ThemeSwitcher` - 主题切换器
- `LanguageSwitcher` - 语言切换器
- `NetworkStatus` - 网络状态

### 模板组件
- `TemplateList` - 模板列表
- `TemplatePanel` - 模板面板
- `TemplateSearch` - 模板搜索
- `TemplatePicker` - 模板选择器

### 画像组件
- `Profile` - 用户画像
- `ProfileHeader` - 画像头部
- `ProfileInfoList` - 画像信息列表
- `ProfileSectionTitle` - 画像分区标题

### 基础组件
- `Avatar` - 头像
- `Button` - 按钮
- `IconButton` - 图标按钮
- `Image` - 图片
- `SearchInput` - 搜索输入框

## Hooks

### React Query Hooks（服务端状态）

- `useConversations` - 获取会话列表
- `useCreateConversation` - 创建新会话
- `useMessages` - 获取消息列表（支持无限滚动）
- `useSendMessage` - 发送消息（支持乐观更新）
- `useMarkAsRead` - 标记消息已读

### Zustand Hooks（客户端状态）

- `useChatStore` - 获取全局状态
- `useUI` - UI 状态
- `useStrategy` - 策略状态
- `useNetwork` - 网络状态
- `useTheme` - 主题状态
- `useLanguage` - 语言状态
- `useConversation` - 会话状态（仅 activeConversationId）
- `useProfile` - 画像状态
- `useActions` - 操作方法

### 其他 Hooks

- `useComposerDraft` - 草稿管理
- `useComposerShortcuts` - 快捷键
- `useTranslation` - 国际化
- `useWebSocket` - WebSocket 连接管理

## 样式

### 自动引入样式

组件库会自动引入样式，无需手动配置。

### 按需引入样式

如果您只想引入主题变量：

```tsx
import '@feoe/bifrost-chat/styles/theme.css';
```

### 自定义主题

通过 CSS 变量自定义主题：

```css
:root {
  --color-primary: #007aff;
  --color-background: #ffffff;
  --color-text: #000000;
  /* ... */
}
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

### 构建

```bash
pnpm run build
```

### 测试

```bash
pnpm run test
```

### 代码检查

```bash
pnpm run lint
```

### 代码格式化

```bash
pnpm run format
```

## Storybook

组件示例与聊天组合视图：

```bash
pnpm run storybook
```

## 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)

## 许可证

[MIT](LICENSE) © FEOF
