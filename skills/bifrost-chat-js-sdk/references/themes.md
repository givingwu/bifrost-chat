# 主题与视觉方案

## 1) 当前主题机制

- 模式枚举：`ThemeModeEnum` = `system | light | dark`
- 状态来源：`theme.slice.ts`
- token 定义：`src/styles/theme.css`
- 切换入口：`ThemeSwitcher`

## 2) 三套方案落地方式

1. `light`：浅色基线方案
2. `dark`：深色基线方案
3. `system`：跟随系统

## 3) 约束

- 优先改 token，不散改组件颜色。
- 保持 light/dark 布局一致。
- Storybook 至少提供 light/dark 对照 stories。
