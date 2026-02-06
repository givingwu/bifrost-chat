# React 声明式架构设计（v3）

## 1. 核心原则

- 用声明式 Query/Mutation 取代命令式数据流程。
- React Query 管服务端状态；Zustand 管客户端状态。
- Hooks 只依赖 Service 接口，不依赖具体请求实现。

## 2. 状态边界

| 状态 | 归属 | 说明 |
|---|---|---|
| 会话列表 | React Query | `useConversations` |
| 消息列表 | React Query | `useMessages`（Infinite Query） |
| 模板列表 | React Query | `useTemplates` |
| UI 状态 | 外部控制 | 输入草稿、面板开关、当前激活会话等由宿主应用管理 |

## 3. Query 规范

- QueryKey 使用 `queryKeys` 统一生成。
- `staleTime` 按业务频率设置（会话/消息 5 分钟、模板可更长）。
- 查询函数只调用注入服务。

## 4. Mutation 规范

发送消息基线：

1. `onMutate` 写入临时消息（`status=sending`）
2. `onError` 回滚缓存
3. `onSuccess` 用真实消息 ID 替换临时消息
4. `onSettled` 视场景 `invalidateQueries`

创建会话基线：

- 推荐 `invalidateQueries(queryKeys.conversations.lists())`
- 需要即时反馈时可做小范围 optimistic patch

## 5. 实时更新

推荐两种接入方式：

1. 宿主在 `messageService.subscribeToMessages` 内处理推送；Hooks/组件侧消费结果。
2. 使用 `useWebSocket` 将事件回灌到 React Query Cache。

约束：

- 推送事件中的协议字段必须在宿主侧被标准化后再回灌。
- SDK 组件层不解析协议原始包。

## 6. 模板能力（明确边界）

- `useTemplates`：模板服务端列表查询
- `useSendTemplateMessage`（可扩展）：模板发送 mutation
- `useTemplatePreview`（可扩展）：模板预览查询
- UI 状态（如面板开关、变量草稿）由外部控制

## 7. 反模式

- 在组件里直接请求 API
- 会话/消息/模板既写 React Query 又写 Zustand
- 在 SDK 内部管理 UI 状态（应交由外部控制）
- 使用 `sessionId`、`useSessions` 等旧术语
- 在 SDK 文档中引入协议适配实现细节
