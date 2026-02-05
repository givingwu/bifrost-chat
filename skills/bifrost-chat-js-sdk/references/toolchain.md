# 工具链与命令

## 1) 可用脚本（以 package.json 为准）

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 监听构建：`pnpm run dev`
- 测试：`pnpm run test`
- 检查并修复：`pnpm run check`
- 格式化：`pnpm run format`
- Storybook：`pnpm run storybook`

## 2) 最小验证建议

1. 文档改动：术语一致性 + 链接检查。
2. hooks/接口改动：`pnpm run test`。
3. 组件改动：`pnpm run test` + Storybook stories 自检。
4. 发布前：`pnpm run build`。

## 3) v3 架构专项检查

- 是否出现公开 `Session` 命名？
- 是否把服务端数据写回 Zustand？
- QueryKey 是否使用 `conversations/messages/templates`？
