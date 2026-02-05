# 渲染层规范（v3）

## 1) 组件职责

- 组件只消费 hooks / store，不直接请求 API。
- 默认组件可用，但允许宿主替换布局与局部组件。

## 2) 数据来源

- 会话：`useConversations`
- 消息：`useMessages`
- 模板：`useTemplates`
- 本地 UI 状态：`useChatStore`

## 3) 输入区约束

- 渠道差异化能力在组件 props 层体现。
- 发送行为通过 mutation hooks 驱动。
- 模板选择只改本地输入状态，不直接发请求。

## 4) 扩展策略

新增消息类型：扩展 `MessageTypeEnum` + 新组件 + 工厂映射 + Storybook stories。

新增模板交互：扩展模板组件与 hooks，不改 Profile 组件职责。

## 5) 可访问性与性能

- 可键盘操作、语义化标签、状态可读。
- 大消息量优先虚拟滚动与分页加载。
