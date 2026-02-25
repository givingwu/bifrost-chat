# Bifrost Chat 文档站点

这是使用 Rspress 构建的 Bifrost Chat JS SDK 文档站点。

## 功能特性

- ✅ **多语言支持**：中文和英文
- ✅ **暗色模式**：支持浅色/深色主题切换
- ✅ **Storybook 集成**：通过 iframe 内嵌交互式组件示例
- ✅ **响应式设计**：适配各种设备
- ✅ **快速搜索**：全文搜索功能

## 开发

### 启动开发服务器

同时启动 Storybook 和 Rspress：

```bash
pnpm run dev:docs
```

这将启动：
- Storybook 开发服务器（http://localhost:6006）
- Rspress 文档服务器（http://localhost:3000）

### 单独启动服务

```bash
# 仅启动 Storybook
pnpm run storybook

# 仅启动文档
pnpm run docs:dev
```

## 构建

### 构建文档

```bash
pnpm run docs:build
```

构建产物将输出到 `docs-site/dist-docs/` 目录。

### 预览构建结果

```bash
pnpm run docs:preview
```

## 目录结构

```
docs-site/
├── docs/                    # 文档内容
│   ├── zh-CN/              # 中文文档
│   │   ├── guide/          # 指南
│   │   ├── components/     # 组件文档
│   │   └── api/            # API 文档
│   └── en-US/              # 英文文档
├── theme/                  # 主题定制
│   ├── StorybookEmbed.tsx # Storybook iframe 组件
│   ├── index.ts           # 主题入口
│   └── styles/            # 自定义样式
├── static/                 # 静态资源
├── rspress.config.ts      # Rspress 配置
└── tsconfig.json          # TypeScript 配置
```

## 添加新组件文档

1. 在 `docs/zh-CN/components/` 或 `docs/en-US/components/` 创建 Markdown 文件
2. 使用 `<StorybookEmbed>` 组件内嵌 Storybook stories：

```markdown
---
title: 组件名称
sidebar_position: 1
---

# 组件名称

组件描述。

## 基础用法

<StorybookEmbed 
  storyId="category-component--story" 
  title="示例标题"
  height="400"
/>

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
```

3. 在 `rspress.config.ts` 的 `sidebar` 配置中添加链接

## Storybook ID 规则

Storybook 的 story ID 格式为：`{category}-{component}--{story}`

例如：
- `basic-button--default` - 基础组件的 Button 的 Default story
- `composer-composertoolbar--with-emoji` - Composer 的 ComposerToolbar 的 With Emoji story

你可以在 Storybook 中查看每个 story 的 ID（URL 中的 `id` 参数）。

## 部署

### 部署到 GitHub Pages

1. 构建文档：
```bash
pnpm run docs:build
```

2. 将 `dist-docs/` 目录推送到 `gh-pages` 分支

### 部署到其他平台

将 `dist-docs/` 目录部署到任何静态网站托管服务（Vercel、Netlify 等）。

## 注意事项

1. **Storybook 必须运行**：文档中的组件示例需要 Storybook 服务运行才能显示
2. **生产环境配置**：在生产环境中，需要配置 Storybook 的公共 URL
3. **主题同步**：暗色模式切换会自动同步到所有 Storybook iframes

## 相关资源

- [Rspress 文档](https://rspress.dev/)
- [Storybook 文档](https://storybook.js.org/)
- [项目主 README](../README.md)
