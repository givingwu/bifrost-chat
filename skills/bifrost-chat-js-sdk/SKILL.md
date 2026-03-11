---
name: bifrost-chat-js-sdk
version: "1.0"
author: "FEOF Team"
description: 开发与维护 Bifrost-Chat JS SDK。用于接口抽象、依赖注入、React Query 与 Zustand 边界治理、Conversation 语义统一、Storybook/Vitest 联动与代码审查场景。
language: "zh-CN"
---

# Bifrost Chat JS SDK

## 适用场景

使用此 skill 的情况：
- ✅ 新增或修改服务接口（IConversationService、IMessageService、ITemplateService）
- ✅ 添加或修改 React Query hooks（useConversations、useMessages、useTemplates 等）
- ✅ 创建或修改状态管理逻辑（Zustand store slices）
- ✅ 调整组件逻辑但不涉及视觉变更
- ✅ 实现 mutation 和 query 的 optimistic/rollback/success 更新
- ✅ 处理依赖注入和服务实现

不使用此 skill 的情况：
- ❌ 仅调整样式和主题（使用 bifrost-chat-ui-design）
- ❌ 仅创建视觉示例或 Storybook（使用 bifrost-chat-ui-design）
- ❌ 纯视觉一致性检查（使用 bifrost-chat-ui-design）

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
- `../../design/final-architecture.md`（架构基线 - SSOT）
- `../../design/naming-conventions.md`（命名规范）
- `../../CLAUDE.md`（项目总体指导）

## 按流程实施

1. 先判断任务类型：接口层、hooks、组件、store、文档。
2. 先校验边界：公开 API 导出、Conversation 术语、状态归属。
3. 再实施变更：优先 `@/*` alias，保持 DI 与声明式数据流。
4. 最后补齐：测试、stories、文档同步更新。
5. 验证完成后主动整理工作区并创建 commit，不等待用户二次提醒。

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

- **SDK 层会话概念统一为 `Conversation`，严格禁止使用 `Session` 或 `Chat` 作为公开命名**（方法名、接口名、类型名、hook 名、queryKey 均适用）。
- 组件和 hooks 不直连 API。
- 服务端状态只放 React Query，Zustand 只放客户端交互态。
- 文档必须标注 As-Is / To-Be。
- **修改 `@src/components/` 下的任何内容时，必须同步更新对应的 `@stories/` 组件设计，增加或更新示例**。

## 会话命名速查（强制）

| 场景 | ✅ 正确 | ❌ 禁止 |
|------|---------|--------|
| 接口 / 类型 | `Conversation`、`IConversationService` | `Session`、`Chat`、`ISessionService`、`IChatService` |
| Hooks | `useConversations`、`useCreateConversation` | `useSessions`、`useChat` |
| QueryKey | `queryKeys.conversations.*` | `queryKeys.sessions.*`、`queryKeys.chats.*` |
| 组件 / Store | `ConversationList`、`conversationSlice` | `SessionList`、`chatSlice` |
| 变量 / 参数 | `conversation`、`conversationId` | `session`、`chatId`（宿主层除外） |

## 交付前检查

- QueryKey 是否仍为 `conversations/messages/templates`。
- mutation 是否满足 optimistic / rollback / success 更新。
- 文档示例是否仅引用公开导出。

## 代码修改流程（强制）

**所有代码修改必须完成以下完整流程，任何一步失败都必须修复后才能继续：**

### 1. 测试（test）
```bash
pnpm run test
```
- 所有测试用例必须通过
- 新增功能必须补充测试用例
- 测试覆盖率不得降低

### 2. 构建（build）
```bash
pnpm run build
```
- 构建必须成功完成
- 无类型错误
- 无构建警告

### 3. 验收标准
- ✅ `pnpm run test` 通过
- ✅ `pnpm run build` 通过
- ✅ 代码符合 Biome 格式规范（`pnpm run check`）
- ❌ 任何一步失败都必须修复后重新执行完整流程

**注意：** 只有当 test 和 build 都成功通过后，代码修改才算完成。跳过任何步骤或在不完整的状态下提交代码是严格禁止的。

## 提交流程（强制）

- 默认行为：只要本次任务包含代码或文档改动，且用户没有明确禁止提交，完成验证后必须主动创建 commit 并提交。
- 提交前必须先执行 `git status --short`，确认只包含本次相关文件；被格式化工具带脏的无关文件必须先恢复。
- 提交信息必须遵循 Conventional Commits，优先使用 `feat:`、`fix:`、`refactor:`、`chore:`、`docs:`、`test:`、`style:`、`hotfix:`。
- 提交说明必须直接描述本次改动的结果，不写空泛标题，不把多类改动硬塞进一个提交。
- 必须使用非交互式 git 命令完成提交；不要使用交互式 rebase 或 amend，除非用户明确要求。
- 如果 `pnpm run test` 失败且确认为仓库既有存量问题，先对本次修改文件执行定向检查并确保通过，再提交本次相关变更；最终回复中必须明确列出未解决的存量问题。
- 如果 `test` 或 `build` 失败，禁止提交。
