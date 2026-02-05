# 工具链与命令

## 1) 真实可用脚本（以 package.json 为准）

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 监听构建：`pnpm run dev`
- 测试：`pnpm run test`
- 检查并修复：`pnpm run check`
- 仅格式化：`pnpm run format`
- Storybook：`pnpm run storybook`

注意：当前无 `pnpm run lint` 脚本，文档与流程需以 `check` 代替。

## 2) 提交前最小校验

按改动范围执行：

1. 仅文档：可跳过构建，至少检查链接与术语一致性。
2. 组件/UI：`pnpm run test` + 受影响 Storybook stories 自检。
3. 类型/接口：`pnpm run test`，必要时补类型测试。
4. 发布前：`pnpm run build`。

## 3) Storybook 约束

涉及 `src/components/*` 的改动，必须同步 Storybook stories：

- 默认态（Default）
- 至少一个变体态
- 至少一个交互或异常态
- 使用中文说明变体目的

常见补充：

- 使用 `useTranslation` 的组件要包 `I18nProvider`。
- 有全局状态依赖的组件要提供必要 Provider 或 mock。
