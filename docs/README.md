# Bifrost-Chat 文档索引

## 文档原则

- 所有架构与规范文档必须区分：
  - 当前已实现（As-Is）
  - 目标架构（To-Be）
- 架构冲突时以 `docs/final-architecture.md` 为准。

## 核心文档

1. 架构基线（SSOT）：`docs/final-architecture.md`
2. 架构总览：`docs/architecture-overview.md`
3. 命名规范：`docs/naming-conventions.md`
4. 文档状态总览：`docs/IMPLEMENTATION_SUMMARY.md`

## 站点文档目录（Rspress）

```text
docs/
├── docs/
│   ├── zh-CN/
│   │   ├── index.md
│   │   ├── guide/
│   │   ├── components/
│   │   └── api/
│   └── en-US/
│       ├── index.md
│       ├── guide/
│       ├── components/
│       └── api/
├── theme/
├── static/
└── tsconfig.json
```

## 开发命令

```bash
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:preview
pnpm run dev:docs
```

## 文档维护流程

1. 先对齐 `docs/final-architecture.md` 的术语与边界。
2. 同步更新 `docs/docs/zh-CN` 与 `docs/docs/en-US`。
3. 若影响协议接入，再同步 `specs/README.md` 与相关 spec。
4. 提交前执行：
   - `pnpm run check`
   - `pnpm run test`
   - `pnpm run build`
