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
4. 与架构冲突时，以 `design/final-architecture.md` 为准。
5. 所有新增或修改代码默认必须补齐 `@JSDoc` 标准注释，至少覆盖导出函数、导出类型、接口与关键辅助函数，并说明职责、参数、返回值和关键边界。
6. 文档不得把内部能力写成包入口公开 API；当前典型内部能力包括
   `OfflineMessageQueueService`、`MessageCacheHelper`、`MessageSyncService`
   和 `src/errors/*` 错误类。

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

## 自动提交约束

1. 默认开启自动提交：
   - 只要任务产生了代码或文档改动，且用户没有明确禁止提交，代理在完成验证后必须自己创建 commit 并提交。
2. 提交前必须清理工作区：
   - 先执行 `git status --short`
   - 只保留本次相关文件
   - 格式化或检查工具带出的无关脏文件必须先恢复
3. 提交信息必须符合 Conventional Commits：
   - 例如 `fix:`、`feat:`、`refactor:`、`docs:`、`test:`、`chore:`
   - 标题只描述本次结果，不写空泛摘要
4. 验证门槛：
   - `pnpm run test` 和 `pnpm run build` 必须通过
   - `pnpm run check` 如被仓库既有存量问题阻塞，需对本次改动文件执行定向检查并通过，再允许提交
5. 失败时禁止提交：
   - 如果本次改动导致 `test`、`build` 或定向检查失败，必须先修复，不能跳过提交门槛
