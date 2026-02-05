# Bifrost-Chat Skills 索引

本文件说明仓库内 skills 的用途与分工。

## 现有 skills

### 1) `bifrost-chat-js-sdk`

路径：`skills/bifrost-chat-js-sdk/SKILL.md`

用途：

- SDK 功能开发与维护
- 接口抽象/依赖注入/React Query/Zustand 架构落地
- 默认组件、Storybook、Vitest、构建链路联动

配套参考：

- `skills/bifrost-chat-js-sdk/references/architecture.md`
- `skills/bifrost-chat-js-sdk/references/rendering.md`
- `skills/bifrost-chat-js-sdk/references/logic.md`
- `skills/bifrost-chat-js-sdk/references/toolchain.md`
- `skills/bifrost-chat-js-sdk/references/conventions.md`
- `skills/bifrost-chat-js-sdk/references/themes.md`

### 2) `bifrost-chat-ui-design`

路径：`skills/bifrost-chat-ui-design/SKILL.md`

用途：

- 组件视觉一致性与设计验收
- 主题 token 设计与 Storybook 视觉回归
- 设计评审清单（可访问性、状态语义、跨主题一致性）

## 维护原则

- skill 文档必须区分“当前已实现”与“目标架构”。
- 命令、类型名、路径必须与仓库代码一致。
- 文档统一遵循 v3 基线：Conversation 命名、DI、React Query 边界。
