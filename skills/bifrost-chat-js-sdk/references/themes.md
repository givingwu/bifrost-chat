# 主题与视觉方案（v3.1）

## 1) 当前已实现（As-Is）

- 模式枚举：`ThemeModeEnum` = `system | light | dark`
- 状态来源：`src/store/slices/theme.slice.ts`
- token 定义：`src/styles/theme.css`
- 切换入口：`ThemeSwitcher`

## 2) 目标架构（To-Be）

- 语义 token 进一步细分并形成主题验收基线。
- 渠道特有状态色语义标准化。

## 3) 约束

- 优先改 token，不散改组件颜色。
- 保持 light/dark 布局一致。
- Storybook 至少提供 light/dark 对照 stories。
