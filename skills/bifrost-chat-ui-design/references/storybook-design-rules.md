# Storybook 设计验收规则

## 每个组件建议最少 3 组 Storybook stories

1. Default：标准状态
2. States：至少包含禁用/错误/空态之一
3. ThemeCompare：同组件的 light/dark 对照

## 文案与说明

- 使用中文说明每个变体的目的。
- 对有交互的组件给出最小可操作示例。

## 与实现保持一致

- props 名称、默认值与组件源码一致。
- 不在 Storybook stories 里引入线上不存在的业务字段。

## 回归检查

- 改动视觉后，至少手工检查：按钮、输入框、消息气泡、状态标记。
