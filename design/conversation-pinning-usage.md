# 会话置顶功能使用指南

## 概述

会话置顶功能提供了**场景化的会话激活策略**，支持根据不同使用场景智能决定是否将会话置顶到列表顶部，提升用户体验。

## 核心特性

### 1. 自动滚动到激活会话
当会话被激活时，会自动滚动到视图可见区域（`scrollIntoView` 行为）。

### 2. 智能置顶策略
根据激活场景的不同，自动决定是否置顶会话：
- **从联系人发起聊天** → 置顶 ✅
- **新会话创建** → 置顶 ✅
- **从系统打开（URL 等）** → 不置顶 ❌
- **点击会话切换** → 不置顶 ❌

### 3. 视觉反馈
置顶的会话在列表中会显示一个小的图钉图标（📌），让用户清楚知道哪些会话被置顶了。

## 使用方法

### 方式一：使用场景化 API（推荐）

```tsx
import { useSetActiveConversation, ActivateConversationScenario } from '@feoe/bifrost-chat';

function MyComponent() {
  const { activateConversation } = useSetActiveConversation();

  // 从联系人发起聊天（会置顶）
  const handleContactClick = (contactId: string) => {
    activateConversation(contactId, ActivateConversationScenario.Contact);
  };

  // 点击会话切换（不置顶）
  const handleConversationClick = (conversationId: string) => {
    activateConversation(conversationId, ActivateConversationScenario.Click);
  };

  // 从系统打开（不置顶）
  const handleSystemOpen = (conversationId: string) => {
    activateConversation(conversationId, ActivateConversationScenario.System);
  };

  // 新会话创建（置顶）
  const handleNewConversation = (conversationId: string) => {
    activateConversation(conversationId, ActivateConversationScenario.NewConversation);
  };

  return (
    // ... UI
  );
}
```

### 方式二：使用底层 API

```tsx
import { useSetActiveConversation } from '@feoe/bifrost-chat';

function MyComponent() {
  const { setActiveConversation } = useSetActiveConversation();

  // 手动控制是否置顶
  const handleSomeAction = (conversationId: string, shouldPin: boolean) => {
    setActiveConversation(conversationId, { pinToTop: shouldPin });
  };

  return (
    // ... UI
  );
}
```

### 方式三：手动管理置顶状态

```tsx
import { useSetActiveConversation } from '@feoe/bifrost-chat';

function MyComponent() {
  const { unpinConversation, clearPinnedConversations } = useSetActiveConversation();

  // 取消特定会话的置顶
  const handleUnpin = (conversationId: string) => {
    unpinConversation(conversationId);
  };

  // 清空所有置顶
  const handleClearAll = () => {
    clearPinnedConversations();
  };

  return (
    // ... UI
  );
}
```

## 场景说明

### ActivateConversationScenario 枚举

| 枚举值 | 说明 | 置顶 | 典型使用场景 |
|--------|------|------|--------------|
| `Contact` | 从联系人发起聊天 | ✅ | 用户从联系人列表选择联系人发起聊天 |
| `NewConversation` | 新会话创建 | ✅ | 系统创建新会话后自动激活 |
| `System` | 从系统打开 | ❌ | 通过 URL 参数、系统集成等方式打开特定会话 |
| `Click` | 点击会话切换 | ❌ | 用户在会话列表中点击切换会话 |

## 实现原理

### 状态管理

置顶状态存储在 Zustand Store 的 `ConversationSlice` 中：

```typescript
interface ConversationState {
  activeConversationId: string;
  pinnedConversationIds: Set<string>; // 置顶的会话 ID 集合
}
```

### 排序逻辑

在 `ConversationList` 组件中，通过 `sortConversationsWithPinned` 函数实现：

1. **置顶会话优先**：置顶的会话排在列表前面
2. **保持相对顺序**：置顶会话之间保持原有顺序（稳定排序）
3. **非置顶会话**：非置顶会话保持原有顺序排在后面

```typescript
function sortConversationsWithPinned(
  conversations: Conversation[],
  pinnedConversationIds: Set<string>,
): Conversation[] {
  const pinned: Conversation[] = [];
  const unpinned: Conversation[] = [];

  for (const conversation of conversations) {
    if (pinnedConversationIds.has(conversation.id)) {
      pinned.push(conversation);
    } else {
      unpinned.push(conversation);
    }
  }

  return [...pinned, ...unpinned];
}
```

### 自动滚动

当 `activeConversationId` 变化时，`ConversationList` 会自动滚动到对应的会话位置：

```typescript
useEffect(() => {
  if (!activeConversationId || !processedConversations) return;

  const activeIndex = processedConversations.findIndex(
    (conversation) => conversation.id === activeConversationId,
  );

  if (activeIndex >= 0) {
    virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
  }
}, [activeConversationId, processedConversations, virtualizer]);
```

## 设计决策

### 为什么使用临时置顶而非永久置顶？

传统的置顶功能通常是永久性的，需要用户手动取消。而我们的临时置顶策略基于以下考虑：

1. **场景化智能决策**：根据使用场景自动决定是否置顶，减少用户手动操作
2. **避免列表混乱**：临时置顶会话会在适当时机自动取消（如用户切换到其他会话）
3. **提升响应速度**：新发起的对话或重要会话能够快速访问

### 为什么点击会话不置顶？

当用户在会话列表中点击切换会话时，不置顶的设计基于：

1. **保持列表稳定**：避免频繁点击导致列表顺序不断变化
2. **符合用户预期**：用户点击只是切换焦点，不期望改变列表顺序
3. **减少视觉干扰**：保持列表的原有排序逻辑（通常是按时间）

## 最佳实践

### 1. 新会话创建场景

```tsx
const { createConversation } = useCreateConversation();
const { activateConversation } = useSetActiveConversation();

const handleNewChat = async (userId: string) => {
  const conversation = await createConversation({ userId });
  // 新会话创建后自动置顶
  activateConversation(conversation.id, ActivateConversationScenario.NewConversation);
};
```

### 2. 从联系人列表发起聊天

```tsx
const { activateConversation } = useSetActiveConversation();

const handleContactClick = async (contact: Contact) => {
  // 查找或创建会话
  const conversationId = await findOrCreateConversation(contact.id);
  // 从联系人发起，置顶以便快速访问
  activateConversation(conversationId, ActivateConversationScenario.Contact);
};
```

### 3. URL 参数打开特定会话

```tsx
const { activateConversation } = useSetActiveConversation();
const { conversationId } = useParams(); // 从 URL 获取

useEffect(() => {
  if (conversationId) {
    // 从系统打开，不置顶，保持列表稳定
    activateConversation(conversationId, ActivateConversationScenario.System);
  }
}, [conversationId]);
```

### 4. 会话列表点击切换

```tsx
const { activateConversation } = useSetActiveConversation();

const handleConversationClick = (conversationId: string) => {
  // 点击会话，不置顶
  activateConversation(conversationId, ActivateConversationScenario.Click);
};
```

## 注意事项

1. **置顶状态是临时的**：置顶状态存储在客户端 Zustand Store 中，刷新页面后会重置
2. **自动滚动优先级**：即使会话不在视图内，也会自动滚动到可见区域
3. **虚拟滚动兼容**：置顶功能与虚拟滚动完全兼容，不受影响
4. **性能考虑**：置顶排序使用稳定的 O(n) 算法，性能影响可忽略

## 迁移指南

如果你正在使用旧的 `setActiveConversationId` 方法，迁移到新的 API 很简单：

### 旧代码
```tsx
const actions = useActions();
actions.setActiveConversationId(conversationId);
```

### 新代码（场景化）
```tsx
const { activateConversation } = useSetActiveConversation();
activateConversation(conversationId, ActivateConversationScenario.Click);
```

### 新代码（手动控制）
```tsx
const { setActiveConversation } = useSetActiveConversation();
setActiveConversation(conversationId, { pinToTop: false });
```

## 相关文件

- Store Slice: `src/store/slices/conversation.slice.ts`
- Hook: `src/hooks/use-set-active-conversation.hook.ts`
- 会话列表: `src/components/conversation/ConversationList.tsx`
- 会话项: `src/components/conversation/ConversationItem.tsx`
