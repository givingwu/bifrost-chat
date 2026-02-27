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
