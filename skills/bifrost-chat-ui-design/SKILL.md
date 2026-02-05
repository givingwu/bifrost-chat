---
name: bifrost-chat-ui-design
description: 面向 Bifrost-Chat 组件库的视觉与交互设计落地。适用于主题 token、组件状态语义、Storybook 设计验收与可访问性检查。
---

# Bifrost-Chat UI Design Skill

目标：在不破坏现有组件 API 的前提下，提升视觉一致性、交互反馈与可访问性。

## 触发场景

- 调整主题或色板
- 组件视觉重构、样式统一
- Storybook 视觉验收与状态补齐
- 需要对照设计稿做落地检查

## 使用流程

1. 先做设计评审：`references/design-checklist.md`
2. 如果涉及主题改动：`references/theme-variants.md`
3. 如果涉及组件展示与验收：`references/storybook-design-rules.md`

## 硬约束

- 颜色和间距优先走 token，不散落硬编码。
- 组件至少覆盖默认态、禁用态、异常态。
- light/dark/system 三模式下布局一致。
- 样式变更必须给出可验证的 Storybook stories 场景。
