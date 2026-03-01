# Bifrost-Chat 命名规范（v3.1）

## 术语约束

### 当前已实现（As-Is）

- 公开会话术语统一使用 `Conversation`。
- 模板模块统一使用 `Template`。
- 关键接口命名：
  - `IConversationService`
  - `IMessageService`
  - `ITemplateService`

### 目标架构（To-Be）

- 历史文档中的 `Session` 仅保留“禁用说明”和兼容映射，不保留执行示例。

## 禁止项

- 禁止新增公开命名：
  - `Session`
  - `ISessionService`
  - `useSessions`
- 禁止把 Template 相关能力放入 Profile 命名空间。

## 类型与文件命名

### As-Is

- 组件：`PascalCase`，如 `ConversationList.tsx`
- hooks：`use-*.hook.ts`（文件）+ `use*`（导出名）
- slice：`*.slice.ts`
- 枚举：`*Enum`
- Provider：`*.provider.tsx`

### To-Be

- 新增 API 文档统一附带“术语一致性检查”小节。

## 参数命名映射（协议兼容）

### As-Is

- SDK 公开层：`conversationId`
- 协议层字段：`chatId`（历史上与 session 语义相关）

### To-Be

- 对外文档以 `conversationId` 为主，`chatId` 仅在协议映射章节出现。
