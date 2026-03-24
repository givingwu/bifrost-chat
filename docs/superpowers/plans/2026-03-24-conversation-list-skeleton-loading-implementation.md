# ConversationList 初次加载骨架屏实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改进 ConversationList 的初次加载体验，使用骨架屏替代通用加载状态

**Architecture:** 在 ConversationList.tsx 的渲染逻辑中添加初次加载判断条件（`isLoading && !conversations`），显示 3 个 ConversationItemSkeleton 而非 LoadingState

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Storybook

---

## 文件结构

```
src/components/conversation/
├── ConversationList.tsx          # 修改：添加初次加载骨架屏逻辑
├── ConversationList.test.tsx     # 修改：添加骨架屏测试用例
└── ConversationItemSkeleton.tsx  # 使用（现有）：骨架屏组件

stories/conversation/
└── ConversationList.stories.tsx  # 修改：添加 Loading story
```

---

## Task 1: 修改 ConversationList 加载状态渲染逻辑

**Files:**
- Modify: `src/components/conversation/ConversationList.tsx:430-437`

- [ ] **Step 1: 定位当前的加载状态判断**

找到第 430-437 行的加载状态代码块：

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

- [ ] **Step 2: 替换为两阶段加载逻辑**

将上述代码替换为：

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

- [ ] **Step 3: 验证文件保存**

确认文件已保存，无 TypeScript 错误

- [ ] **Step 4: Commit**

```bash
git add src/components/conversation/ConversationList.tsx
git commit -m "feat(conversation-list): add skeleton loading for initial load state"
```

---

## Task 2: 添加初次加载骨架屏测试

**Files:**
- Modify: `src/components/conversation/ConversationList.test.tsx`
- Test: `src/components/conversation/ConversationList.test.tsx`

- [ ] **Step 1: 在测试文件顶部导入 ConversationItemSkeleton**

在第 7 行 import 后添加：

```tsx
import { ConversationItemSkeleton } from './ConversationItemSkeleton';
```

- [ ] **Step 2: Mock ConversationItemSkeleton 组件**

在 vi.mock 部分之后（第 97 行之前）添加：

```tsx
vi.mock('./ConversationItemSkeleton', () => ({
  ConversationItemSkeleton: () => (
    <div data-testid="conversation-item-skeleton" />
  ),
}));
```

- [ ] **Step 3: 编写初次加载显示骨架屏的测试**

在 describe 块内添加新的测试用例：

```tsx
it('初次加载时应渲染 3 个骨架屏', () => {
  const { useConversations: originalMock } = require('@/hooks/use-conversations.hook');

  // Mock 初次加载状态：isLoading=true, data=null
  const mockUseConversations = () => ({
    data: null,
    isLoading: true,
    isFetching: true,
    error: null,
    refetch: vi.fn(),
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  });

  vi.doMock('@/hooks/use-conversations.hook', () => ({
    useConversations: mockUseConversations,
  }));

  render(<ConversationList autoFetch={true} />);

  const skeletons = screen.getAllByTestId('conversation-item-skeleton');
  expect(skeletons).toHaveLength(3);
  expect(screen.queryByTestId('conversation-item-conv-1')).not.toBeInTheDocument();
});
```

- [ ] **Step 4: 编写刷新时不显示骨架屏的测试**

添加第二个测试用例：

```tsx
it('有数据后刷新时应显示 LoadingState 而非骨架屏', () => {
  const conversations = [createConversation(1)];

  render(
    <ConversationList
      autoFetch={false}
      conversations={conversations}
      isLoading={true}
    />,
  );

  // 有数据时即使 isLoading=true 也不应显示骨架屏
  expect(screen.queryByTestId('conversation-item-skeleton')).not.toBeInTheDocument();
  // 应显示真实会话项
  expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument();
});
```

- [ ] **Step 5: 运行测试验证失败**

```bash
pnpm run test -- ConversationList.test.tsx
```

预期结果：测试通过（骨架屏正确渲染）

- [ ] **Step 6: Commit**

```bash
git add src/components/conversation/ConversationList.test.tsx
git commit -m "test(conversation-list): add skeleton loading tests"
```

---

## Task 3: 添加 Loading Story 到 Storybook

**Files:**
- Modify: `stories/conversation/ConversationList.stories.tsx`

- [ ] **Step 1: 在文件末尾添加 Loading story**

在第 277 行后添加：

```tsx
/**
 * 加载状态 - 初次加载显示骨架屏
 */
export const Loading = () => {
  return (
    <div className="w-80 h-96">
      <ConversationList conversations={null} isLoading={true} autoFetch={false} />
    </div>
  );
};

/**
 * 刷新状态 - 有数据时的加载状态
 */
export const Refreshing = () => {
  return (
    <div className="w-80 h-96">
      <ConversationList conversations={mockConversations} isLoading={true} autoFetch={false} />
    </div>
  );
};
```

- [ ] **Step 2: 启动 Storybook 验证**

```bash
pnpm run storybook
```

在浏览器中打开：
- `Conversation/ConversationList/Loading` - 应显示 3 个骨架屏
- `Conversation/ConversationList/Refreshing` - 应显示会话列表 + LoadingState

- [ ] **Step 3: Commit**

```bash
git add stories/conversation/ConversationList.stories.tsx
git commit -m "stories(conversation-list): add Loading and Refreshing stories"
```

---

## Task 4: 运行完整测试套件和构建验证

**Files:**
- None（验证任务）

- [ ] **Step 1: 运行所有测试**

```bash
pnpm run test
```

预期结果：所有测试通过，无新增失败

- [ ] **Step 2: 运行代码检查**

```bash
pnpm run check
```

预期结果：无 Biome 错误或警告

- [ ] **Step 3: 运行生产构建**

```bash
pnpm run build
```

预期结果：构建成功，无 TypeScript 错误

- [ ] **Step 4: 验证骨架屏样式一致性**

手动检查或添加注释验证：
- `ConversationItemSkeleton` 内部使用 `p-3` (padding: 0.75rem)
- 骨架屏容器使用 `p-2` (padding: 0.5rem)
- 确认整体视觉对齐一致

- [ ] **Step 5: Commit（如有调整）**

如需微调，提交最终版本：

```bash
git add .
git commit -m "fix(conversation-list): adjust skeleton spacing for visual consistency"
```

---

## 实施注意事项

### 关键判断条件
`isLoading && !conversations` 是核心逻辑：
- `isLoading`：正在加载中
- `!conversations`：还没有任何数据（包括缓存）

此条件确保：
- ✅ 首次加载（无数据）→ 显示骨架屏
- ✅ 有数据后刷新 → 显示 LoadingState
- ✅ 加载失败 → ErrorState 覆盖骨架屏

### 样式一致性
- 容器：`space-y-1 p-2` - 与真实列表一致
- 骨架屏内部：`p-3` - ConversationItemSkeleton 自带的内边距
- 间距：`space-y-1` 对应 `CONVERSATION_LIST_ITEM_GAP`

### 可访问性
- `aria-live="polite"` - 已存在于 output 元素
- `aria-hidden="true"` - ConversationItemSkeleton 内部已设置

### 测试覆盖
- 初次加载 → 3 个骨架屏
- 刷新状态 → LoadingState，无骨架屏
- 边界场景：错误、空数据、有数据

---

## 验收标准

- [ ] 首次加载会话列表时显示 3 个骨架屏
- [ ] 有数据后再次加载时显示 LoadingState
- [ ] 错误状态正确覆盖骨架屏
- [ ] 所有测试通过（单元测试 + Storybook）
- [ ] 生产构建成功
- [ ] 代码检查通过（Biome）
