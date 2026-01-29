---
name: bifrost-chat-js-sdk
description: 针对 Bifrost-Chat JS SDK 的功能开发、维护与代码审查。适用于涉及 TypeScript/React 组件、Zustand 状态、渠道策略(strategy)、消息渲染工厂、ChannelAdapter/NetLayer/DataLayer 架构、Tailwind 样式、Storybook 示例、Rslib 构建与 Vitest 测试的修改与新增。
---

# Bifrost-Chat JS SDK Skill

用最少步骤完成 SDK 维护与扩展，优先保证可维护性、性能与可访问性。

## 快速流程

1. 判断改动范围：渲染层 / 逻辑层 / 构建测试 / 主题样式。
2. 先读对应参考：
   - 渲染层：`references/rendering.md`
   - 逻辑层：`references/logic.md`
   - 架构总览：`references/architecture.md`
   - 工具链与命令：`references/toolchain.md`
   - 代码规范：`references/conventions.md`
   - 主题方案：`references/themes.md`
3. 设计变更点：避免破坏现有 API，保证策略驱动与可扩展性。
4. 编码：保持 TS 强类型、Tailwind 变量规范、JSX 双引号。
5. 必要时补测试与 Storybook。

## 关键约束

- 不能写死渠道按钮，必须依赖 `strategy.allowedChannels`。
- 渲染层通过工厂模式/策略模式扩展消息与组件类型。
- 逻辑层必须遵循 Store/DataLayer/Adapter/NetLayer 分层。
- 新增功能尽量复用现有模块，避免重复逻辑。
- 主题设计必须提供 3 套方案。

## 变更前检查清单

- 是否影响公开 API 或消息 DTO？
- 是否需要扩展 BubbleMap/ChannelButtonFactory？
- 是否会破坏 optimistic UI/离线队列/去重逻辑？
- 是否需要更新 Storybook 与测试用例？

## 参考入口

- 架构与模块责任：`references/architecture.md`
- 渲染层规范与组件策略：`references/rendering.md`
- 逻辑层与适配器：`references/logic.md`
- 工具链与命令：`references/toolchain.md`
- 编码规范与风格：`references/conventions.md`
- 主题设计方案：`references/themes.md`
