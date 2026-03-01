# Bifrost-Chat 架构总览

## 文档角色

- 本文档用于快速理解整体架构与职责边界。
- 详细约束与最终口径请以 `docs/final-architecture.md` 为准。

## 当前已实现（As-Is）

### 分层结构

1. 接口层：`src/services/*.ts`
2. 逻辑层（数据编排）：`src/hooks/*.hook.ts`
3. 状态层（客户端交互）：`src/store/slices/*.slice.ts`
4. 渲染层：`src/components/*`
5. 协议层：`src/services/protocol/*` 与 `src/services/websocket/*`

### 关键设计点

- 会话统一术语：`Conversation`（公开 API 禁用 `Session`）。
- DI 注入：`ServiceProvider` + `useServices`。
- 状态边界：React Query（服务端状态）+ Zustand（客户端状态）。
- 模板与画像分离：`template/` 与 `profile/` 目录职责明确。

## 目标架构（To-Be）

1. 模板发送与预览链路独立为标准 query/mutation。
2. 实时能力公开边界标准化。
3. 渠道策略矩阵配置化（含互斥策略）。
4. 无障碍与安全接入矩阵补齐。

## 架构检查清单

- 是否在公开 API 中引入了 `Session` 命名？
- 是否把服务端实体列表写入了 Zustand？
- 是否跨越 Template/Profile 职责边界？
- 文档是否已区分 As-Is 与 To-Be？
