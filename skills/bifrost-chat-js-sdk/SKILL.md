---
name: bifrost-chat-js-sdk
description: 开发与维护 Bifrost-Chat JS SDK。用于接口抽象、依赖注入、React Query 与 Zustand 边界治理、Conversation 语义统一、Storybook/Vitest 联动与代码审查场景。
---

# Bifrost Chat JS SDK

## 执行目标

- 交付可维护、可测试、可扩展的 SDK 代码与文档。
- 严格遵循双轨口径：As-Is 与 To-Be 分离。

## 先读这些资料

- `references/architecture.md`
- `references/rendering.md`
- `references/logic.md`
- `references/conventions.md`
- `references/toolchain.md`
- `references/themes.md`
- `../../docs/final-architecture.md`

## 按流程实施

1. 先判断任务类型：接口层、hooks、组件、store、文档。
2. 先校验边界：公开 API 导出、Conversation 术语、状态归属。
3. 再实施变更：优先 `@/*` alias，保持 DI 与声明式数据流。
4. 最后补齐：测试、stories、文档同步更新。

## 当前已实现（As-Is）关注点

- 公开导出以 `src/index.ts`、`src/components/index.ts` 为准。
- Provider 统一命名为 `QueryProvider`。
- 模板目录为 `src/components/template/`。
- 错误类型以 `error.interface.ts` 为准。

## 目标架构（To-Be）关注点

- 模板发送/预览链路独立化。
- 实时能力公开边界标准化。
- 渠道策略矩阵完善。

## 强制约束

- 只使用 `Conversation` 语义，禁止新增公开 `Session` 命名。
- 组件和 hooks 不直连 API。
- 服务端状态只放 React Query，Zustand 只放客户端交互态。
- 文档必须标注 As-Is / To-Be。

## 交付前检查

- QueryKey 是否仍为 `conversations/messages/templates`。
- mutation 是否满足 optimistic / rollback / success 更新。
- 文档示例是否仅引用公开导出。
- 是否执行 `pnpm run check && pnpm run test && pnpm run build`。
