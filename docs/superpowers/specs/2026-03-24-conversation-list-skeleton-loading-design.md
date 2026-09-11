# ConversationList 初次加载骨架屏设计

**日期**：2026-03-24
**状态**：设计中
**作者**：Claude (AI Assistant)

## 概述

改进 `ConversationList` 组件的初次加载体验，使用骨架屏（Skeleton）替代当前的通用加载状态，提供更清晰的内容预览和更好的用户感知。

## 背景

### 当前问题
- 初次加载会话列表时，显示通用的 `LoadingState`（居中的 loading 图标）
- 用户无法感知即将出现的列表布局和内容形态
- 与现代应用（微信、Twitter 等）的 UX 模式不一致

### 改进目标
- 初次加载时显示 3 个 `ConversationItemSkeleton`，模拟真实列表布局
- 保持其他状态（错误、刷新、空状态）的现有行为
- 提升用户对"内容即将到来"的期待感

## 需求总结

| 维度 | 选择 |
|------|------|
| **显示场景** | 仅初次加载（`isLoading && !conversations`） |
| **Skeleton 数量** | 固定 3 个 |
| **错误处理** | ErrorState 直接覆盖 Skeleton |
| **实现方式** | 在 `ConversationList.tsx` 中内联实现 |

## 设计方案

### 1. 组件修改

修改 `src/components/conversation/ConversationList.tsx` 的加载状态逻辑（第 430-437 行）：

**修改前**：
```tsx
// 加载状态
if (isLoading) {
  return (
    <output className={containerClassName} aria-live="polite">
      <LoadingState message={t('common.loading')} />
    </output>
  );
}
```

**修改后**：
```tsx
// 初次加载状态：显示 3 个 Skeleton
if (isLoading && !conversations) {
  return (
    <output className={containerClassName} aria-live="polite">
      <div className="space-y-1 p-2">
        <ConversationItemSkeleton />
        <ConversationItemSkeleton />
        <ConversationItemSkeleton />
      </div>
    </output>
  );
}

// 后续加载状态（如下拉刷新）：显示 LoadingState
if (isLoading) {
  return (
    <output className={containerClassName} aria-live="polite">
      <LoadingState message={t('common.loading')} />
    </output>
  );
}
```

### 2. 状态流转

```
初始状态
    │
    │ isLoading=true, conversations=null
    ▼
┌─────────────────┐
│ 3 个 Skeleton    │  ← 新增
└─────────────────┘
    │
    │ 数据返回
    ▼
    ├─ conversations.length > 0 → 显示会话列表
    │
    └─ conversations.length === 0 → 显示 EmptyState

错误 → ErrorState（覆盖 Skeleton）
刷新 → LoadingState（保持原有行为）
```

### 3. 样式与可访问性

- **容器样式**：`space-y-1 p-2`，与真实列表保持一致
- **ARIA**：`aria-live="polite"` 屏幕阅读器友好通知
- **可访问性**：`ConversationItemSkeleton` 内部已设置 `aria-hidden="true"`

### 4. 边界场景

| 场景 | 条件 | 显示 |
|------|------|------|
| 首次加载 | `isLoading && !conversations` | 3 个 Skeleton |
| 有内容 | `!isLoading && conversations.length > 0` | 会话列表 |
| 空数据 | `!isLoading && conversations.length === 0` | EmptyState |
| 加载失败 | `error != null` | ErrorState |
| 刷新 | `isLoading && conversations` | LoadingState |

## 测试策略

### 单元测试
- 验证 `isLoading && !conversations` 时渲染 3 个 Skeleton
- 验证其他状态下 Skeleton 不应出现
- 验证容器类名和 ARIA 属性

### 集成测试场景
1. **首次加载**：`isLoading=true, data=null` → 显示 Skeleton
2. **加载成功**：数据返回 → 显示列表或空状态
3. **加载失败**：error → 显示 ErrorState
4. **刷新场景**：有数据后再次加载 → 显示 LoadingState

### Storybook
- 在 `ConversationList.stories.tsx` 添加 `Loading` story

## 影响范围

- **修改文件**：`src/components/conversation/ConversationList.tsx`
- **新增文件**：无
- **影响组件**：仅 `ConversationList`
- **向后兼容**：完全兼容，不影响现有 API

## 实施步骤

1. 修改 `ConversationList.tsx` 加载状态逻辑
2. 添加单元测试
3. 添加/更新 Storybook stories
4. 运行 `pnpm run test` 和 `pnpm run build` 验证

## 未来考虑

- 如果消息列表、模板列表也需要类似模式，可抽取通用的 `SkeletonList` 组件
- 可考虑通过 prop 让宿主应用自定义 Skeleton 数量（当前固定 3 个）

## 参考

- 现有 `ConversationItemSkeleton` 组件：`src/components/conversation/ConversationItemSkeleton.tsx`
- 项目架构文档：`design/final-architecture.md`
