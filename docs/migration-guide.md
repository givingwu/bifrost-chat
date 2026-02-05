# 架构迁移指南（迁移到 v3）

## 1. 迁移目标

从旧实现迁移到：

- 公开 API 仅使用 `Conversation`
- 接口注入（ServiceProvider）
- React Query 管服务端状态（含模板）
- Zustand 仅保留 UI 本地状态

## 2. 分阶段迁移

### 阶段 1：命名治理

- 将公开 `Session` 命名迁移为 `Conversation`。
- 统一 QueryKey：`conversations/messages/templates`。

### 阶段 2：接口注入

- 实现 `IConversationService`。
- 实现 `IMessageService`。
- 实现 `ITemplateService`。
- 用 `ServiceProvider` 注入实现。

### 阶段 3：状态迁移

- 会话列表迁移到 `useConversations`。
- 消息列表迁移到 `useMessages`。
- 模板列表迁移到 `useTemplates`。
- 清理 Store 中服务端状态字段。

### 阶段 4：发送链路迁移

- 使用 `useSendMessage` + optimistic update。
- 失败回滚并输出统一错误类型。
- 模板发送使用独立 mutation。

### 阶段 5：清理与验收

- 删除公开 API 中 `session*` 字段与类型。
- 验证 Storybook stories 与测试通过。
- 文档与代码示例统一到 v3 口径。

## 3. 迁移检查清单

- [ ] 无公开 `Session` 命名
- [ ] 三大服务接口已注入
- [ ] 模板数据已归 React Query
- [ ] Zustand 仅保留 UI 状态
- [ ] 发送链路具备 optimistic + rollback
- [ ] 关键组件 Storybook stories 完整
