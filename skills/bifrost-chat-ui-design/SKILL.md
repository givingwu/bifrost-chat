---
name: bifrost-chat-ui-design
description: 落地 Bifrost-Chat 组件视觉与交互设计。用于主题 token 调整、组件状态语义统一、Storybook 视觉验收、可访问性检查与跨主题一致性治理。
---

# Bifrost Chat UI Design

## 执行目标

- 在不破坏现有 API 的前提下，提升视觉一致性与交互可读性。
- 在 `light/dark/system` 三模式下保持语义一致与可访问性。

## 先读这些资料

- 设计评审清单：`references/design-checklist.md`
- Storybook 验收规则：`references/storybook-design-rules.md`
- 主题变体规则：`references/theme-variants.md`

## 按流程实施

1. 先做设计评审，确认信息层级、状态语义、无障碍风险。
2. 再改 token 与样式，优先修改主题变量，避免散落硬编码。
3. 再补 Storybook，至少覆盖 default、states、theme compare。
4. 最后做跨主题回归，验证关键组件与状态标记可辨识。

## 强制约束

- 只通过 token 管理颜色和间距，不在组件里写死主题色。
- 只在 Storybook 中使用真实 props 与真实状态字段。
- 只接受可键盘操作、对比度合格、非纯颜色表达状态的方案。
- 只提交包含视觉验证路径的改动。
