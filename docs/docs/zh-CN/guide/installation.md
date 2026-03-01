# 安装指南

## 当前已实现（As-Is）

- 包名：`@feoe/bifrost-chat`
- 打包产物包含组件、hooks、类型、Provider、协议层工具。

## 目标架构（To-Be）

- 补充按场景裁剪（仅 hooks / 仅组件）的安装文档。

## 依赖安装

```bash
pnpm add @feoe/bifrost-chat
```

或：

```bash
npm install @feoe/bifrost-chat
yarn add @feoe/bifrost-chat
```

## 样式引入

```ts
import '@feoe/bifrost-chat/styles';
```

可选按需引入主题变量：

```ts
import '@feoe/bifrost-chat/styles/theme';
```

## 运行要求

- React 19+
- TypeScript strict 模式（推荐）
- 建议使用 `@tanstack/react-query` 配套 Provider
