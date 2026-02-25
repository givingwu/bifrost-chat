# React 声明式架构设计（v3.1）

## 1. 核心原则

- 用声明式 Query/Mutation 取代命令式数据流。
- React Query 管服务端状态；Zustand 管客户端状态。
- Hooks 依赖服务接口，不依赖具体请求实现。

## 2. 当前状态边界（As-Is）

| 状态 | 归属 | 说明 |
|---|---|---|
| 会话列表 | React Query | `useConversations` |
| 消息列表 | React Query | `useMessages`（Infinite Query） |
| 模板列表 | React Query | `useTemplates` |
| UI 交互态 | Zustand | `strategy/conversation/theme/language/network/profile/composer` |

补充：

- SDK 内置 Zustand store。
- 宿主可通过 `ConfigProvider` 初始化 store 初值。

## 3. Query 规范

- QueryKey 统一通过 `queryKeys` 生成。
- 查询函数只调用注入服务。
- `staleTime` 与重试策略由 `QueryProvider` 默认配置提供。

## 4. Mutation 规范

### 4.1 当前已实现（As-Is）

- `useSendMessage`：已实现 optimistic update + rollback + success 更新。
- `useCreateConversation`：创建后失效会话列表缓存。
- `useMarkAsRead`：消息已读 mutation。

### 4.2 仓库内部能力（非公开导出）

- `useSendAttachment`
- `useSendAudio`

### 4.3 目标架构（To-Be）

- `useSendTemplateMessage`
- `useTemplatePreview`

## 5. 实时更新

### 当前已实现（As-Is）

- 存在 WebSocket 管理能力与 Query Cache 集成工具。
- 该能力当前未从包入口公开导出。

### 目标架构（To-Be）

- 统一实时事件模型，并评估公开 API 输出边界。

## 6. 反模式

- 在组件里直接请求 API。
- 服务端状态在 React Query 与 Zustand 双写。
- 把 `Session` 术语写入公开类型、字段、Hook。
- 对外文档声明未导出的 API 为公开能力。
