---
name: bifrost-chat-js-sdk
description: 开发与维护 Bifrost-Chat JS SDK。用于接口抽象、依赖注入、React Query 与 Zustand 边界治理、Conversation 语义统一、Storybook/Vitest 联动与代码审查场景。
---

# Bifrost Chat JS SDK

## 执行目标

- 交付可维护、可测试、可扩展的 SDK 代码。
- 严格遵循 v3 基线：`Conversation` 命名、接口注入、状态边界清晰。

## 先读这些资料

- 架构总览：`references/architecture.md`
- 渲染约束：`references/rendering.md`
- 逻辑约束：`references/logic.md`
- 代码规范：`references/conventions.md`
- 工具链与验证：`references/toolchain.md`
- 主题规则：`references/themes.md`
- 深入文档：`../../docs/final-architecture.md`
- 深入文档：`../../docs/sdk-interface-abstraction-design.md`
- 深入文档：`../../docs/reactive-architecture-design.md`

## 按流程实施

1. 先判断任务类型：接口层、hooks、组件、store、文档。
2. 先校验命名与边界：公开 API 禁止 `Session`，服务端状态不进 Zustand。
3. 再实施变更：优先使用 `@/*` alias，保持 DI 与接口抽象。
4. 最后补齐配套：组件变更补 Storybook，行为变更补 Vitest。

## 强制约束

- 只使用 `Conversation` 语义，禁止新增公开 `Session` 命名。
- 只在服务实现中访问后端，组件与 hooks 不直连 API。
- 只把服务端状态放在 React Query，Zustand 只存客户端交互态。
- 只在 Template 域处理模板能力，不把 Template 职责并回 Profile。

## 交付前检查

- 确认 QueryKey 仍按 `conversations/messages/templates` 组织。
- 确认 mutation 包含 optimistic update、rollback、success replace。
- 确认文档、stories、测试与代码同步更新。
