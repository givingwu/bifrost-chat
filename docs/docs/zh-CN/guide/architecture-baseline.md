# 架构基线

> 最后更新：2026-02-28  
> 适用范围：`@feoe/bifrost-chat` JS SDK

本文档是 SDK 架构的快速参考，完整架构以 `docs/final-architecture.md` 为准。

## 核心概念

### Conversation（会话）

SDK 统一使用 **Conversation** 概念，公开 API 中严格禁止使用 Session 命名。

```typescript
// ✅ 正确
interface Conversation {}
useConversations()
conversationId

// ❌ 错误
interface Session {}
useSessions()
sessionId
```

### 依赖注入

SDK 不直连后端 API，所有服务通过 `ServiceProvider` 注入：

```tsx
import { ServiceProvider } from '@feoe/bifrost-chat';

<ServiceProvider services={{
  conversationService: myConversationService,
  messageService: myMessageService,
  templateService: myTemplateService,
}}>
  <App />
</ServiceProvider>
```

### 状态边界

| 状态类型 | 管理方案 | 示例 |
|---|---|---|
| 服务端状态 | React Query | 会话列表、消息列表、模板列表 |
| 客户端状态 | Zustand | 输入配置、面板开关、主题、语言 |

## 目录结构

```
src/
├── components/     # UI 组件
│   ├── composer/   # 输入区
│   ├── conversation/ # 会话列表
│   ├── messages/   # 消息流
│   ├── profile/    # 联系人信息
│   ├── template/   # 模板面板
│   └── layout/     # 布局组件
├── hooks/          # React Hooks
├── interfaces/     # 类型定义
├── providers/      # Provider 组件
├── services/       # 服务接口
└── store/          # Zustand Store
```

## 公开 API

### Hooks

- `useConversations` - 会话列表查询
- `useCreateConversation` - 创建会话
- `useMessages` - 消息列表查询
- `useSendMessage` - 发送消息
- `useMarkAsRead` - 标记已读
- `useTemplates` - 模板列表查询

### Providers

- `QueryProvider` - React Query 配置
- `ServiceProvider` - 服务注入
- `ConfigProvider` - SDK 配置
- `I18nProvider` - 国际化

### 组件

- `DefaultChatLayout` - 默认布局
- `MessageList` / `InfiniteMessageList` - 消息列表
- `Composer` 系列 - 输入组件
- `Profile` - 联系人信息
- `TemplatePanel` - 模板面板

## 错误类型

```typescript
SDKError          // 基类
├── HTTPError     // HTTP 错误
├── ValidationError // 校验错误
├── AuthorizationError // 授权错误
├── ConfigurationError // 配置错误
├── NotImplementedError // 未实现
└── MapperError   // 映射错误
```

## 性能优化

- **虚拟滚动**：`@tanstack/react-virtual`
- **分页**：React Query infinite query
- **缓存**：React Query query cache

## 国际化

当前支持：
- 中文（zh-CN）
- 英文（en-US）

## 扩展阅读

- [完整架构文档](/zh-CN/guide/final-architecture)
- [命名约定](/zh-CN/guide/naming-conventions)
- [安装指南](/zh-CN/guide/installation)