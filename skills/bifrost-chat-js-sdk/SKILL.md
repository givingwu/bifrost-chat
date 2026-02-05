---
name: bifrost-chat-js-sdk
description: 针对 Bifrost-Chat JS SDK 的功能开发、维护与代码审查。适用于 TypeScript/React 组件、Zustand 状态、渠道策略、消息渲染工厂、Adapter 架构、Tailwind 样式、Storybook 与 Vitest 相关任务。
---

# Bifrost-Chat JS SDK Skill

目标：用最少步骤完成 SDK 维护与扩展，优先保证可维护性、性能与可访问性。

## 快速流程

1. 先判断任务落点：渲染层 / 逻辑层 / 构建测试 / 主题样式。
2. 按需读取参考文档：
   - 渲染层：`references/rendering.md`
   - 逻辑层：`references/logic.md`
   - 架构快照与演进：`references/architecture.md`
   - 工具链与命令：`references/toolchain.md`
   - 命名与代码规范：`references/conventions.md`
   - 主题与视觉方案：`references/themes.md`
3. 设计变更：优先复用既有 API 与模块，避免破坏公开类型。
4. 编码：优先 TypeScript 强类型；路径优先使用 `@/*` alias。
5. 校验：至少执行受影响范围的测试/构建，并补充 Storybook（如涉及组件）。

## 当前实现快照（以仓库代码为准）

- Store 使用 Zustand Slice 组合（`ui/strategy/network/theme/language/conversation/profile`）。
- `AdapterFactory` 已落地，默认内置 `WabaAdapter`；其他渠道接口已预留。
- 消息渲染通过 `MessageRendererFactory` + `MessageBubble` 落地。
- `ComposerToolbar` 已按渠道差异控制附件类型和长度限制。
- 主题模式为 `system/light/dark`，通过 token 驱动。
- `DataLayer/NetLayer/OfflineQueue` 当前以架构约束和接口目标为主，尚未完整实现。

## 关键约束

- 组件改动必须同步更新对应 story。
- 渠道渲染逻辑必须策略驱动，禁止写死分支到业务数据。
- 新渠道/新消息类型必须走 Adapter + Mapper + Factory 扩展。
- 不把后端字段变化泄漏到 Store/UI，格式变化仅在 Mapper 层消化。
- 文档描述要区分“当前已实现”与“目标架构”。

## 变更前检查清单

- 是否影响公开 API、枚举或 DTO 类型？
- 是否需要扩展 `ChannelButtonFactory` / `MessageRendererFactory`？
- 是否需要同步更新 Storybook、测试、README/skills 文档？
- 是否引入与现状不一致的“未来态描述”？
