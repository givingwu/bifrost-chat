# 主题方案落地规则（v3.1）

## 模式映射

- `light`：浅色主方案
- `dark`：深色主方案
- `system`：跟随系统

## token 调整优先级

1. 语义色（primary/success/warning/error）
2. 前景与背景（foreground/background/card）
3. 边框与输入（border/input/muted）

## 改动步骤

1. 修改 `src/styles/theme.css` 变量。
2. 通过 `ThemeSwitcher` 检查切换行为。
3. 在 Storybook 覆盖至少一个组件的 light/dark 对照。

## 禁止项

- 直接在组件里写死主题色。
- 只改浅色，不验证深色。
- 在文档中省略 As-Is / To-Be 边界。
