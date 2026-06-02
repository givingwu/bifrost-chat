# 渲染层规范（v3.1）

## 1) 组件职责

- 组件只消费 hooks / store，不直接请求 API。
- 默认组件可用，宿主可替换布局和局部组件。

## 2) 数据来源

### As-Is

- 会话：`useConversations`
- 消息：`useMessages`
- 模板：`useTemplates`
- 模板预览：`useTemplatePreview`
- 未读：`useUnreadSync` + `useChannelUnread` / `useConversationUnread`
- 本地 UI 状态：`useChatStore`

## 3) 输入区约束

### As-Is

- 发送行为通过 mutation hooks 驱动。
- Composer 功能开关通过 `composer` slice 控制。

### To-Be

- 渠道策略矩阵完整化（不同渠道能力差异）。

## 4) 模板交互

### As-Is

- 模板选择在 `TemplatePanel` / 移动端 ActionSheet。
- `useTemplateSelect` 先通过 `useTemplatePreview` 渲染模板，再按
  `composer.templateMode` 直接发送或回填 Composer。

### To-Be

- 扩展独立模板发送 hook。

## 5) 可访问性与性能

- 组件应支持键盘操作与语义化标签。
- 大消息量场景优先虚拟滚动与分页加载。
