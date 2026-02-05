# 主题与视觉方案

## 1) 当前主题机制

- 模式枚举：`ThemeModeEnum` = `system | light | dark`
- 状态来源：`theme.slice.ts`
- token 定义：`src/styles/theme.css`
- 切换入口：`ThemeSwitcher`

## 2) 三套设计方案的落地方式

该仓库的“三套方案”建议映射为：

1. `light`：浅色基线方案
2. `dark`：深色基线方案
3. `system`：跟随系统自动切换

即：当前以“模式 + token”承载方案，不额外引入并行样式系统。

## 3) 设计改动约束

- 优先改 token，不直接散改组件颜色。
- 保持同一组件在 light/dark 下布局一致。
- 新增视觉规范时，先补 token 命名，再改组件。
- Storybook 至少提供 light/dark 对比示例。

## 4) 推荐检查清单

- 主色、语义色（success/warning/error）是否双主题都可读。
- 输入、边框、弱文本在暗色下是否有足够对比度。
- 状态色（如 in-call）是否与危险色可区分。
