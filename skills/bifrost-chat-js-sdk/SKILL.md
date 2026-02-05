---
name: bifrost-chat-js-sdk
description: 针对 Bifrost-Chat JS SDK 的功能开发、维护与代码审查。适用于 TypeScript/React 组件、接口抽象、依赖注入、React Query 状态管理、Zustand 本地状态、Storybook 与 Vitest 相关任务。
---

# Bifrost-Chat JS SDK Skill

目标：按 v3 基线快速交付可维护、可测试、可扩展的 SDK 代码。

## v3 架构基线（必须遵守）

1. 会话语义统一 `Conversation`，公开 API 禁止 `Session`。
2. SDK 形态为：纯接口 + DI + 默认组件实现。
3. SDK 不约束协议适配与字段转换方案（调用方自行实现）。
4. 服务端状态归 React Query（会话/消息/模板）。
5. 客户端状态归 Zustand（UI 交互状态）。
6. Template 从 Profile 解耦，类型与服务独立。

## 快速流程

1. 先定位任务：接口层 / Hooks / 组件 / Store / 文档。
2. 优先阅读：
   - `../../docs/final-architecture.md`
   - `../../docs/sdk-interface-abstraction-design.md`
   - `../../docs/reactive-architecture-design.md`
3. 编码时优先使用 `@/*` alias。
4. 组件改动必须补 Storybook stories。
5. 提交前至少执行受影响范围测试。

## 当前实现快照（以仓库代码为准）

- 已有 Service 接口：`src/services/*.service.ts`
- 已有 Provider：`service.provider.tsx`、`query.provider.tsx`
- 已有 React Query hooks：会话/消息/发送/已读
- 已有默认组件：conversation/messages/composer/profile 等
- Store 仍有部分服务端状态遗留，处于迁移阶段

## 关键约束

- 禁止新增公开 `Session` 命名。
- 禁止在 SDK 组件内直接请求后端。
- 禁止把模板数据长驻到 Zustand。
- 禁止在文档中引入“SDK 内置协议适配实现”要求。

## 变更前检查清单

- 是否影响公开接口签名？
- QueryKey 是否仍使用 `conversations/messages/templates`？
- 是否把服务端状态错误放入 Zustand？
- 是否同步更新 docs/ 与 skills/ 文档？
