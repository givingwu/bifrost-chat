# Bifrost-Chat Skills 索引

本文件说明仓库内 skills 的用途、分工与维护口径。

## 现有 skills

### 1) `bifrost-chat-js-sdk`

路径：`skills/bifrost-chat-js-sdk/SKILL.md`

用途：

- SDK 功能开发与维护
- 接口抽象、依赖注入、React Query / Zustand 边界治理
- Conversation 语义一致性治理
- Storybook / Vitest / 构建链路联动

### 2) `bifrost-chat-ui-design`

路径：`skills/bifrost-chat-ui-design/SKILL.md`

用途：

- 组件视觉一致性与设计验收
- 主题 token 调整与 Storybook 视觉回归
- 可访问性、状态语义、跨主题一致性检查

## 维护约束（强制）

1. skill 文档必须区分：
   - 当前已实现（As-Is）
   - 目标架构（To-Be）
2. 命令、类型名、路径必须与仓库代码一致。
3. 对外 API 口径以 `src/index.ts` 与 `src/components/index.ts` 为准。
4. 与架构冲突时，以 `docs/final-architecture.md` 为准。
