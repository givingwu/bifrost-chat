# 架构迁移指南（v3.1）

## 1. 迁移目标

- 公开 API 统一 `Conversation` 命名。
- 对齐接口注入（`ServiceProvider`）。
- 服务端状态归 React Query。
- 客户端交互态归 Zustand。
- 文档示例严格对齐公开导出。

## 2. 当前基线（As-Is）

- 已有 `QueryProvider`、`ServiceProvider`、`ConfigProvider`。
- 已有 `useConversations`、`useMessages`、`useSendMessage`、`useTemplates`。
- 默认布局已可运行。

## 3. 迁移步骤（To-Be）

### 步骤 1：命名治理

- 清理公开文档中的 `Session` 术语。
- 统一 QueryKey 术语：`conversations/messages/templates`。

### 步骤 2：导出边界治理

- 文档 API 清单以 `src/index.ts`、`src/components/index.ts` 为准。
- 移除未导出能力的“公开 API”描述。

### 步骤 3：状态边界治理

- 保证会话/消息/模板列表只在 React Query。
- 保证 Zustand 只保留 UI 交互状态。

### 步骤 4：模板链路治理

- 当前：沿用 `TemplatePanel` -> `useSendMessage`。
- 目标：演进独立模板 mutation/query（保持兼容）。

### 步骤 5：验收

- 运行 `pnpm run check && pnpm run test && pnpm run build`。
- 核对文档关键词回归（见下方检查清单）。

## 4. 迁移检查清单

- [ ] 无公开 `Session` 命名
- [ ] API 清单仅包含公开导出
- [ ] Provider 命名统一为 `QueryProvider`
- [ ] 模板目录统一为 `src/components/template/`
- [ ] 无失效命令引用（如历史脚本名）
- [ ] 关键文档均区分 As-Is / To-Be
