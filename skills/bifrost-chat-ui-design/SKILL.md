---
name: bifrost-chat-ui-design
version: "1.0"
author: "FEOF Team"
description: 落地 Bifrost-Chat 组件视觉与交互设计。用于主题 token 调整、组件状态语义统一、Storybook 视觉验收、可访问性检查与跨主题一致性治理。
language: "zh-CN"
---

# Bifrost Chat UI Design

## 适用场景

使用此 skill 的情况：
- ✅ 调整主题变量和 token（颜色、间距、字体等）
- ✅ 修改组件样式但不涉及逻辑变更
- ✅ 创建或更新 Storybook 视觉示例
- ✅ 进行可访问性检查（ARIA、键盘导航、语义）
- ✅ 跨主题一致性验证（light/dark/system）
- ✅ 视觉设计和交互体验优化

不使用此 skill 的情况：
- ❌ 涉及服务接口修改（使用 bifrost-chat-js-sdk）
- ❌ 涉及 React Query hooks 修改（使用 bifrost-chat-js-sdk）
- ❌ 涉及状态管理逻辑（使用 bifrost-chat-js-sdk）
- ❌ 涉及组件业务逻辑（使用 bifrost-chat-js-sdk）

## 执行目标

- 在不破坏公开 API 的前提下提升视觉一致性与交互可读性。
- 在 `light/dark/system` 三模式下保持语义一致与可访问性。

## 先读这些资料

- `references/design-checklist.md`
- `references/storybook-design-rules.md`
- `references/theme-variants.md`
- `../../design/final-architecture.md`（架构基线 - SSOT）
- `../../design/naming-conventions.md`（命名规范）
- `../../CLAUDE.md`（项目总体指导）

## 按流程实施

1. 先做设计评审，确认信息层级、状态语义、无障碍风险。
2. 再改 token 与样式，优先改主题变量，避免散落硬编码。
3. 再补 Storybook，至少覆盖 default / states / theme compare。
4. 最后做跨主题回归与可键盘操作检查。

## 当前已实现（As-Is）关注点

- 主题切换入口：`ThemeSwitcher`
- 主题状态：`theme.slice.ts`
- 主题变量：`src/styles/theme.css`

## 目标架构（To-Be）关注点

- 渠道状态语义色统一规则。
- 组件级可访问性验收矩阵完善。

## 强制约束

- 通过 token 管理颜色和间距，不写死主题色。
- Storybook 仅使用真实 props 和真实状态字段。
- 方案必须可键盘操作、可读且跨主题一致。
- **修改 `@src/components/` 下的任何内容时，必须同步更新对应的 `@stories/` 组件设计，增加或更新示例**。

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
