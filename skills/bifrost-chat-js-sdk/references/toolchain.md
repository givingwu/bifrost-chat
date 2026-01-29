# 工具链与命令

## 常用命令

- 安装依赖：`pnpm install`
- 构建：`pnpm run build`
- 监听构建：`pnpm run dev`
- 测试：`pnpm run test`
- 代码检查：`pnpm run lint`
- 格式化：`pnpm run format`

## 构建体系

- Rslib 负责产物构建。
- 配置读取：`rslib.config.ts` 使用 `PORT` 与 `ENV_MODE`。

## Storybook

- 启动：`pnpm run storybook`。
- 新组件需要新增 story。

## 测试

- Vitest 为默认测试体系。
- 测试文件：`*.test.ts` / `*.test.tsx`。
- 覆盖重点：状态存储、Hooks、路由守卫等流程。
