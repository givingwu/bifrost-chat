# UI 灵活性设计（v3.1）

## 1. 设计目标

- 提供默认实现，开箱即用。
- 保留组合与替换能力，支持深度定制。
- 不破坏接口注入和状态边界。

## 2. 当前能力（As-Is）

### A. Headless（完全自定义）

```tsx
<ConfigProvider config={config}>
  <QueryProvider>
    <ServiceProvider {...services}>
      <ChatContainer>
        <MyLayout />
      </ChatContainer>
    </ServiceProvider>
  </QueryProvider>
</ConfigProvider>
```

### B. Compound（组合式）

```tsx
<ChatContainer>
  <ChatLayout
    topbar={<Topbar title="聊天窗口" />}
    conversationPanel={<CustomConversationPanel />}
    composer={<CustomComposer />}
    profilePanel={<CustomContextPanel />}
  >
    <CustomMessageList />
  </ChatLayout>
</ChatContainer>
```

### C. All-in-One（默认布局）

```tsx
<ChatContainer>
  <DefaultChatLayout />
</ChatContainer>
```

## 3. 约束

- 自定义组件仍需通过 hooks 获取服务端状态。
- 不允许绕过 Provider 直接请求 API。
- 公开命名遵循 Conversation 术语与 QueryKey 规范。

## 4. 目标架构（To-Be）

- 渠道策略矩阵配置化输出。
- 模板链路独立 mutation/query 能力。
