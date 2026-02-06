# UI 灵活性设计（v3）

## 1. 设计目标

- 提供默认实现，开箱即用
- 保留 Headless 能力，支持深度定制
- 不破坏接口注入和状态边界

## 2. 三层 API 模式

### A. Headless

```tsx
<ReactQueryProvider>
  <ServiceProvider {...services}>
    <ChatContainer locale="zh-CN">
      <MyLayout />
    </ChatContainer>
  </ServiceProvider>
</ReactQueryProvider>
```

### B. Compound

```tsx
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

### C. All-in-One

```tsx
<ChatContainer locale="zh-CN">
  <DefaultChatLayout />
</ChatContainer>
```

## 3. 约束

- 自定义组件仍需通过 hooks 获取服务端状态。
- 不允许绕过 Provider 直接请求 API。
- 所有自定义 UI 仍应遵守 Conversation 命名与 QueryKey 规范。

## 4. 推荐实践

- 业务复杂场景优先 Headless。
- 品牌定制场景优先 Compound。
- 快速上线优先 All-in-One。
