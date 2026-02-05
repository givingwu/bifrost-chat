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
- ⚡ **高性能** - 基于 Zustand 状态管理
- 🎯 **易用性** - 简单的 API 设计
- 🧩 **模块化** - 支持按需引入
- 🔄 **全渠道** - 支持 WhatsApp、SMS、Email 等多种渠道

## 技术栈

- **语言**: TypeScript
- **框架**: React 19+
- **样式**: Tailwind CSS 4+
- **状态管理**: Zustand
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

## 组件列表

### 布局组件
- `ChatContainer` - 聊天容器（包含 I18nProvider）
- `ChatLayout` - 聊天布局
- `ChatTopbar` - 顶部工具栏
- `DefaultChatLayout` - 默认聊天布局（开箱即用）

### 消息组件
- `ChatMessageList` - 消息列表
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
- `ComposerAttachments` - 附件预览
- `AttachmentPreview` - 附件预览项
- `ComposerHint` - 输入提示
- `EmojiPicker` - 表情选择器
- `MentionPicker` - 提及选择器
- `TemplatePicker` - 模板选择器

### 会话组件
- `ConversationList` - 会话列表
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

### 画像组件
- `Profile` - 用户画像
- `ProfileHeader` - 画像头部
- `ProfileInfoList` - 画像信息列表
- `ProfileSearch` - 画像搜索
- `ProfileSectionTitle` - 画像分区标题
- `ProfileTemplates` - 画像模板

### 基础组件
- `Avatar` - 头像
- `Button` - 按钮
- `IconButton` - 图标按钮
- `Image` - 图片

## Hooks

- `useChatStore` - 获取全局状态
- `useComposerDraft` - 草稿管理
- `useComposerShortcuts` - 快捷键
- `useTranslation` - 国际化
- `useUI` - UI 状态
- `useStrategy` - 策略状态
- `useNetwork` - 网络状态
- `useTheme` - 主题状态
- `useLanguage` - 语言状态
- `useConversation` - 会话状态
- `useProfile` - 画像状态
- `useActions` - 操作方法

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
