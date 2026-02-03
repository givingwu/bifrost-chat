# UI 渲染层灵活性设计

> 本文档描述 Bifrost-Chat JS SDK UI 渲染层的灵活性设计方案，确保最大可扩展性。

## 设计目标

1. **ChatContainer** 只负责集成 Store 提供数据源 + Provider
2. **ChatLayout** 提供默认布局，所有组件都是灵活设计，可传可不传
3. 支持用户自己实现各个部分组件
4. 提供三层 API：Headless、Compound、All-in-One

## 当前设计分析

### ✅ 做得好的地方

**[`ChatLayout`](../src/components/layout/ChatLayout.tsx)** 已经支持灵活的插槽设计：

```typescript
export interface ChatLayoutProps {
  className?: string;
  styles?: React.CSSProperties;
  conversationPanel?: ReactNode;  // 可选
  topbar?: ReactNode;             // 可选
  children: ReactNode;            // 消息区域
  composer?: ReactNode;           // 可选
  contextPanel?: ReactNode;        // 可选
}
```

### ❌ 存在的问题

**[`ChatContainer`](../src/components/layout/ChatContainer.tsx)** 硬编码了所有组件：

```typescript
// 当前实现 - 硬编码组件
<ChatLayout
  topbar={
    topbar && (
      <ChatTopbar
        title={conversationTitle}
        subtitle={conversationSubtitle}
        avatarUrl={conversationAvatar}
        extra={/* ... */}
      />
    )
  }
  conversationPanel={
    <ConversationPanel
      header={
        <ConversationHeader title={finalMessages.title}>
          <ChannelFilter /* ... */ />
        </ConversationHeader>
      }
    >
      <ConversationList conversations={conversation.conversations} />
    </ConversationPanel>
  }
  composer={
    <ComposerToolbar
      channel={strategy.activeChannel}
      value={''}
      onChange={() => {}}
    />
  }
  contextPanel={
    <ContextPanel
      profile={context.profile}
      templates={context.templates}
      renderCustom={context.renderContextPanel}
    />
  }
>
  {children}
</ChatLayout>
```

**问题**：
- 用户无法自定义 `ChatTopbar`、`ConversationPanel`、`ComposerToolbar`、`ContextPanel` 的实现
- 违背了"最大可扩展性"的设计目标
- ChatContainer 承担了太多职责（既提供数据源，又提供默认 UI）

## 改进方案

### 方案 1：三层 API 设计（推荐）

#### 层级 1：Headless Container

只提供数据源和 Provider，完全由用户自定义布局。

```typescript
<ChatContainer locale="zh-CN">
  <MyCustomLayout />
</ChatContainer>
```

**特点**：
- ChatContainer 只负责 Provider + Store 绑定
- 用户完全控制布局和组件实现
- 适合需要深度定制的场景

#### 层级 2：Compound Layout

提供默认布局，但所有组件都可以自定义。

```typescript
<ChatContainer locale="zh-CN">
  <ChatLayout
    topbar={<CustomTopbar />}
    conversationPanel={<CustomConversationPanel />}
    composer={<CustomComposer />}
    contextPanel={<CustomContextPanel />}
  >
    <CustomMessageList />
  </ChatLayout>
</ChatContainer>
```

**特点**：
- ChatLayout 提供默认布局结构
- 所有插槽都是可选的
- 用户可以替换任何部分组件
- 适合需要部分定制的场景

#### 层级 3：All-in-One

开箱即用，使用默认组件。

```typescript
<ChatContainer locale="zh-CN">
  <ChatLayout />
</ChatContainer>
```

**特点**：
- 使用所有默认组件
- 零配置快速集成
- 适合快速原型和简单场景

### 方案 2：Render Props 模式

通过 Render Props 提供数据访问。

```typescript
<ChatContainer locale="zh-CN">
  {({
    store,
    actions,
    strategy,
    network,
    theme,
    language,
    conversation,
    context
  }) => (
    <CustomLayout
      store={store}
      actions={actions}
      strategy={strategy}
      network={network}
      theme={theme}
      language={language}
      conversation={conversation}
      context={context}
    />
  )}
</ChatContainer>
```

**特点**：
- 显式传递所有状态和操作
- 类型安全
- 适合需要精确控制数据流的场景

### 方案 3：Context + Hooks 模式

通过 Context 暴露数据，使用 Hooks 访问。

```typescript
// ChatContainer 只提供 Context
<ChatContainer locale="zh-CN">
  <MyCustomLayout />
</ChatContainer>

// 用户组件中使用 Hooks
function MyCustomLayout() {
  const store = useChatStore();
  const { strategy, network, theme } = store;
  const actions = useActions();

  return (
    <div>
      <CustomTopbar strategy={strategy} actions={actions} />
      {/* ... */}
    </div>
  );
}
```

**特点**：
- 最灵活，用户完全控制
- 与 React 生态一致
- 需要用户了解 Store 结构

## 推荐实现

### 重构 ChatContainer

```typescript
// src/components/layout/ChatContainer.tsx
import { type ReactNode, useMemo } from 'react';
import { enUSMessages, zhCNMessages } from '@/index';
import { LanguageCode } from '@/interfaces/language.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';

export interface ChatContainerProps {
  /** 语言代码 */
  locale?: LanguageCode;
  /** 子组件 */
  children: ReactNode;
  /** 渠道点击回调 */
  onChannelClick?: (type: ChannelType) => void;
  /** 主题切换回调 */
  onThemeChange?: (mode: ThemeMode) => void;
  /** 语言切换回调 */
  onLanguageChange?: (language: LanguageCode) => void;
}

/**
 * ChatContainer：SDK 根容器（Provider + Store 绑定）。
 *
 * @example Headless 模式
 * <ChatContainer locale="zh-CN">
 *   <MyCustomLayout />
 * </ChatContainer>
 *
 * @example Compound 模式
 * <ChatContainer locale="zh-CN">
 *   <ChatLayout
 *     topbar={<CustomTopbar />}
 *     conversationPanel={<CustomConversationPanel />}
 *   >
 *     <CustomMessageList />
 *   </ChatLayout>
 * </ChatContainer>
 */
export const ChatContainer = ({
  locale,
  children,
  onChannelClick,
  onThemeChange,
  onLanguageChange,
}: ChatContainerProps) => {
  const { theme, language, actions } = useChatStore();

  const resolvedLanguage = useMemo(() => {
    if (locale) return locale;
    if (typeof navigator !== 'undefined') {
      const browserLanguage = navigator.language as LanguageCode;
      if (Object.values(LanguageCode).includes(browserLanguage)) {
        return browserLanguage;
      }
    }
    return LanguageCode.EnUS;
  }, [locale]);

  const finalMessages = useMemo(() => {
    return LanguageMessages[resolvedLanguage] || enUSMessages;
  }, [resolvedLanguage]);

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      actions.setTheme(mode);
      onThemeChange?.(mode);
    },
    [actions, onThemeChange],
  );

  const handleLanguageChange = useCallback(
    (code: LanguageCode) => {
      actions.setLanguage(code);
      onLanguageChange?.(code);
    },
    [actions, onLanguageChange],
  );

  const handleChannelClick = useCallback(
    (channel: ChannelType) => {
      actions.setActiveChannel(channel);
      onChannelClick?.(channel);
    },
    [actions, onChannelClick],
  );

  return (
    <I18nProvider
      data-component="chat-container"
      data-theme={theme.mode}
      data-language={resolvedLanguage}
      locale={resolvedLanguage}
      messages={finalMessages}
    >
      <ChatContext.Provider
        value={{
          onThemeChange: handleThemeChange,
          onLanguageChange: handleLanguageChange,
          onChannelClick: handleChannelClick,
        }}
      >
        {children}
      </ChatContext.Provider>
    </I18nProvider>
  );
};
```

### 新增 ChatContext

```typescript
// src/contexts/chat.context.tsx
import { createContext, useContext } from 'react';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { LanguageCode } from '@/interfaces/language.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';

export interface ChatContextValue {
  onThemeChange?: (mode: ThemeMode) => void;
  onLanguageChange?: (language: LanguageCode) => void;
  onChannelClick?: (type: ChannelType) => void;
}

export const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatContainer');
  }
  return context;
};
```

### 新增 DefaultChatLayout（All-in-One）

```typescript
// src/components/layout/DefaultChatLayout.tsx
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import { useChatStore } from '@/store';
import { ComposerToolbar } from '../composer/ComposerToolbar';
import { ContextPanel } from '../context/ContextPanel';
import { ConversationHeader } from '../conversation/ConversationHeader';
import { ConversationList } from '../conversation/ConversationList';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { NetworkStatus } from '../toolbar/NetworkStatus';
import { ThemeSwitcher } from '../toolbar/ThemeSwitcher';
import { ChatLayout } from './ChatLayout';
import { ChatTopbar } from './ChatTopbar';
import { useChatContext } from '@/contexts/chat.context';

/**
 * DefaultChatLayout：默认布局（All-in-One 模式）。
 *
 * @example
 * <ChatContainer locale="zh-CN">
 *   <DefaultChatLayout />
 * </ChatContainer>
 */
export const DefaultChatLayout = () => {
  const { strategy, network, theme, language, conversation, context } =
    useChatStore();
  const { onThemeChange, onLanguageChange, onChannelClick } = useChatContext();

  const conversationTitle = conversation.activeConversation?.user?.name;
  const conversationSubtitle = conversation.activeConversation?.channel;
  const conversationAvatar = conversation.activeConversation?.user?.avatarUrl;

  return (
    <ChatLayout
      className="max-w-[1400px]"
      topbar={
        <ChatTopbar
          title={conversationTitle}
          subtitle={conversationSubtitle}
          avatarUrl={conversationAvatar}
          extra={
            <div className="flex items-center gap-4">
              <NetworkStatus status={network.status} />

              <div className="flex gap-1">
                <LanguageSwitcher
                  value={language.code}
                  onChange={onLanguageChange}
                />
                <ThemeSwitcher
                  value={theme.mode}
                  onChange={onThemeChange}
                />
              </div>
            </div>
          }
        />
      }
      conversationPanel={
        <ConversationPanel
          header={
            <ConversationHeader title={conversationTitle}>
              <ChannelFilter
                channels={AvailableChannelTypes}
                activeChannel={strategy.activeChannel}
                onChannelClick={onChannelClick}
              />
            </ConversationHeader>
          }
        >
          <ConversationList conversations={conversation.conversations} />
        </ConversationPanel>
      }
      composer={
        <ComposerToolbar
          channel={strategy.activeChannel}
          value={''}
          onChange={() => {}}
        />
      }
      contextPanel={
        <ContextPanel
          profile={context.profile}
          templates={context.templates}
          renderCustom={context.renderContextPanel}
        />
      }
    >
      {/* 消息区域由 ChatMessageList 渲染 */}
    </ChatLayout>
  );
};
```

## 使用示例

### 示例 1：Headless 模式（完全自定义）

```typescript
import { ChatContainer } from '@bifrost-chat/sdk';
import { useChatStore } from '@bifrost-chat/sdk';

function MyCustomLayout() {
  const { strategy, network, theme } = useChatStore();

  return (
    <div className="my-custom-layout">
      <div className="topbar">
        <span>Network: {network.status}</span>
        <span>Theme: {theme.mode}</span>
      </div>
      <div className="content">
        {/* 完全自定义的消息列表 */}
      </div>
    </div>
  );
}

function App() {
  return (
    <ChatContainer locale="zh-CN">
      <MyCustomLayout />
    </ChatContainer>
  );
}
```

### 示例 2：Compound 模式（部分自定义）

```typescript
import { ChatContainer, ChatLayout } from '@bifrost-chat/sdk';
import { CustomTopbar } from './CustomTopbar';
import { CustomMessageList } from './CustomMessageList';

function App() {
  return (
    <ChatContainer locale="zh-CN">
      <ChatLayout
        topbar={<CustomTopbar />}
        // 使用默认的 conversationPanel、composer、contextPanel
      >
        <CustomMessageList />
      </ChatLayout>
    </ChatContainer>
  );
}
```

### 示例 3：All-in-One 模式（开箱即用）

```typescript
import { ChatContainer, DefaultChatLayout } from '@bifrost-chat/sdk';

function App() {
  return (
    <ChatContainer locale="zh-CN">
      <DefaultChatLayout />
    </ChatContainer>
  );
}
```

### 示例 4：Render Props 模式

```typescript
import { ChatContainer } from '@bifrost-chat/sdk';

function App() {
  return (
    <ChatContainer locale="zh-CN">
      {({ store, actions, strategy, network, theme }) => (
        <MyCustomLayout
          store={store}
          actions={actions}
          strategy={strategy}
          network={network}
          theme={theme}
        />
      )}
    </ChatContainer>
  );
}
```

## 架构优势

### 1. 职责分离

- **ChatContainer**：只负责 Provider + Store 绑定
- **ChatLayout**：只负责布局结构
- **DefaultChatLayout**：提供默认实现
- **用户组件**：完全自定义

### 2. 灵活性

- 用户可以选择任意层级
- 所有组件都是可选的
- 支持渐进式增强

### 3. 可扩展性

- 新增组件不影响现有代码
- 用户可以替换任何部分
- 支持自定义布局

### 4. 类型安全

- 所有 API 都有明确的类型定义
- TypeScript 提供完整的类型推导

### 5. 开发体验

- Headless 模式：完全自由
- Compound 模式：快速定制
- All-in-One 模式：零配置

## 迁移指南

### 从当前设计迁移到新设计

**当前代码**：
```typescript
<ChatContainer locale="zh-CN">
  {children}
</ChatContainer>
```

**迁移后**（保持兼容）：
```typescript
// 选项 1：使用 DefaultChatLayout（推荐）
<ChatContainer locale="zh-CN">
  <DefaultChatLayout />
</ChatContainer>

// 选项 2：使用 ChatLayout（自定义）
<ChatContainer locale="zh-CN">
  <ChatLayout>
    {children}
  </ChatLayout>
</ChatContainer>
```

## 总结

通过三层 API 设计（Headless、Compound、All-in-One），我们实现了：

1. ✅ ChatContainer 只负责集成 Store 提供数据源 + Provider
2. ✅ ChatLayout 提供默认布局，所有组件都是灵活设计，可传可不传
3. ✅ 支持用户自己实现各个部分组件
4. ✅ 提供最大可扩展性

这个设计遵循了 React 社区的最佳实践，类似于 Radix UI、Headless UI 等库的设计理念。

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-02
**维护者**: Bifrost-Chat Team
