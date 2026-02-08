# useComposerDraft Hook 使用指南

## 概述

[`useComposerDraft`](../src/hooks/use-composer-draft.hook.ts:1) 是一个用于自动保存输入框草稿的 Hook，支持防抖、错误处理和 SSR（服务端渲染）。

### 核心特性

- **自动保存**：输入内容自动保存到 localStorage
- **防抖优化**：默认 500ms 防抖，减少频繁写入
- **错误处理**：配额超限等错误的优雅处理
- **SSR 兼容**：自动检测浏览器环境
- **会话隔离**：基于 key 的独立存储

### 架构定位

[`useComposerDraft`](../src/hooks/use-composer-draft.hook.ts:1) 与 [`OfflineMessageQueueService`](../src/services/offline-message-queue.service.ts:19) 解决不同层面的问题：

- **useComposerDraft**：UI 体验工具，保护用户输入，提升体验
- **OfflineMessageQueueService**：可靠性服务，保证消息发送，提升可靠性

详见：[`composer-draft-vs-offline-queue-comparison.md`](./composer-draft-vs-offline-queue-comparison.md:1)

## API 参考

### 参数

```typescript
interface ComposerDraftOptions {
  /** 防抖延迟时间（毫秒），默认 500ms */
  debounceDelay?: number;
  /** 是否在组件卸载时自动清除草稿，默认 false */
  clearOnUnmount?: boolean;
  /** 保存成功回调 */
  onSave?: (value: string) => void;
  /** 保存失败回调 */
  onSaveError?: (error: Error) => void;
}

function useComposerDraft(
  key: string,
  value: string,
  options?: ComposerDraftOptions
): ComposerDraftReturn
```

### 返回值

```typescript
interface ComposerDraftReturn {
  /** 从 localStorage 加载草稿 */
  loadDraft: () => string;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 立即保存草稿（跳过防抖） */
  saveDraft: () => void;
  /** 检查是否存在草稿 */
  hasDraft: () => boolean;
  /** 是否已加载初始值 */
  initialValueLoaded: boolean;
}
```

## 集成使用

### 当前已实现（As-Is）

[`useComposerDraft`](../src/hooks/use-composer-draft.hook.ts:1) 已集成到 [`ComposerToolbar`](../src/components/composer/ComposerToolbar.tsx:90) 组件中，默认启用。

### 使用 ComposerWithSend

最简单的使用方式，通过 [`ComposerWithSend`](../src/components/composer/ComposerWithSend.tsx:35) 组件：

```tsx
import { ComposerWithSend } from '@feoe/bifrost-chat';

function ConversationPanel({ conversationId }: { conversationId: string }) {
  return (
    <ComposerWithSend
      conversationId={conversationId}
      channel="whatsapp"
    />
  );
}
```

### 使用 ComposerToolbar

直接使用 [`ComposerToolbar`](../src/components/composer/ComposerToolbar.tsx:90) 组件：

```tsx
import { ComposerToolbar } from '@feoe/bifrost-chat';
import { ChannelTypeEnum } from '@feoe/bifrost-chat';

function ConversationPanel({ conversationId }: { conversationId: string }) {
  const handleSend = async (message: string) => {
    // 发送消息逻辑
    await sendMessage({ conversationId, content: message });
  };

  return (
    <ComposerToolbar
      conversationId={conversationId}
      channel={ChannelTypeEnum.WhatsApp}
      onSend={handleSend}
    />
  );
}
```

## 配置选项

### 全局配置

通过 [`useChatStore`](../src/store/index.ts:245) 配置草稿行为：

```tsx
import { useChatStore } from '@feoe/bifrost-chat';

function App() {
  const setComposerConfig = useChatStore((state) => state.actions.setComposerConfig);

  useEffect(() => {
    setComposerConfig({
      // 草稿功能配置
      enableDraft: true,              // 是否启用草稿（默认 true）
      draftDebounceDelay: 500,        // 防抖延迟（默认 500ms）
      clearDraftOnSend: true,         // 发送后清除（默认 true）
      keepDraftOnSwitch: true,        // 切换会话保留（默认 true）
    });
  }, [setComposerConfig]);

  return <ChatContainer />;
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enableDraft` | `boolean` | `true` | 是否启用草稿自动保存 |
| `draftDebounceDelay` | `number` | `500` | 防抖延迟时间（毫秒） |
| `clearDraftOnSend` | `boolean` | `true` | 发送成功后是否自动清除草稿 |
| `keepDraftOnSwitch` | `boolean` | `true` | 切换会话时是否保留草稿 |

### 禁用草稿功能

```tsx
import { useChatStore } from '@feoe/bifrost-chat';

function App() {
  const setComposerConfig = useChatStore((state) => state.actions.setComposerConfig);

  useEffect(() => {
    setComposerConfig({
      enableDraft: false, // 禁用草稿
    });
  }, [setComposerConfig]);

  return <ChatContainer />;
}
```

## 使用场景

### 场景 1：多会话草稿隔离

每个会话有独立的草稿，切换会话时自动加载对应草稿：

```tsx
import { useState } from 'react';
import { ComposerWithSend } from '@feoe/bifrost-chat';

function ConversationList({ conversations }: { conversations: Array<{ id: string }> }) {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id || '');

  return (
    <div>
      {/* 会话列表 */}
      <ul>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            onClick={() => setActiveConversationId(conv.id)}
            className={conv.id === activeConversationId ? 'active' : ''}
          >
            会话 {conv.id}
          </li>
        ))}
      </ul>

      {/* 输入框 - 切换会话时自动加载对应草稿 */}
      <ComposerWithSend
        key={activeConversationId}
        conversationId={activeConversationId}
        channel="whatsapp"
      />
    </div>
  );
}
```

### 场景 2：自定义防抖延迟

为不同场景设置不同的防抖延迟：

```tsx
import { useChatStore } from '@feoe/bifrost-chat';

// 聊天场景：快速输入，短防抖
setComposerConfig({
  draftDebounceDelay: 500, // 500ms
});

// 邮件场景：长文本，长防抖
setComposerConfig({
  draftDebounceDelay: 1000, // 1秒
});
```

### 场景 3：发送后保留草稿

配置发送成功后不自动清除草稿（适用于需要保留输入内容的场景）：

```tsx
import { useChatStore } from '@feoe/bifrost-chat';

setComposerConfig({
  clearDraftOnSend: false, // 发送后不清除草稿
});
```

### 场景 4：切换会话时清除草稿

配置切换会话时不保留草稿（适用于临时输入场景）：

```tsx
import { useChatStore } from '@feoe/bifrost-chat';

setComposerConfig({
  keepDraftOnSwitch: false, // 切换会话时清除草稿
});
```

## 最佳实践

### 1. Key 命名规范

```typescript
// ✅ 推荐：使用有意义的命名
`conversation-${conversationId}`

// ❌ 避免：使用过于简单或冲突的 key
'draft'
'message'
```

### 2. 防抖延迟设置

```typescript
// 快速输入场景（如聊天）
{ draftDebounceDelay: 500 }

// 表单场景（如邮件）
{ draftDebounceDelay: 1000 }

// 实时保存场景
{ draftDebounceDelay: 200 }
```

### 3. 草稿清理时机

```typescript
// 发送成功后清除（默认）
setComposerConfig({
  clearDraftOnSend: true,
});

// 发送成功后保留
setComposerConfig({
  clearDraftOnSend: false,
});
```

### 4. 错误处理

草稿功能内置错误处理，配额超限时会在控制台输出警告：

```typescript
// 配额超限错误
[useComposerDraft] localStorage quota exceeded, draft not saved

// 其他错误
[useComposerDraft] Failed to save draft: <error message>
```

## 技术细节

### 存储结构

```typescript
// localStorage 键名格式
const DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';
const storageKey = `${DRAFT_KEY_PREFIX}${key}`;

// 示例
'bifrost-chat-draft-conversation-123'
'bifrost-chat-draft-conversation-456'
```

### SSR 兼容性

```typescript
const isBrowser =
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined';

// 所有操作都会先检查浏览器环境
if (!isBrowser) {
  return; // 在服务端静默失败
}
```

### 防抖实现

```typescript
useEffect(() => {
  // 清除之前的定时器
  if (saveTimeoutRef.current !== undefined) {
    clearTimeout(saveTimeoutRef.current);
  }

  // 延迟保存
  saveTimeoutRef.current = window.setTimeout(() => {
    performSave(value);
  }, debounceDelay);

  return () => {
    // 清理定时器
    if (saveTimeoutRef.current !== undefined) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [value, debounceDelay]);
```

## 注意事项

1. **存储限制**：localStorage 通常有 5-10MB 的限制，大量草稿可能导致配额超限
2. **隐私敏感**：不要在草稿中存储敏感信息（密码、令牌等）
3. **跨标签页**：localStorage 在同一浏览器的所有标签页间共享，注意 key 冲突
4. **清理策略**：建议定期清理过期草稿，避免占用过多空间
5. **类型安全**：草稿只存储字符串，复杂对象需要序列化

## 相关组件

- [`ComposerToolbar`](../src/components/composer/ComposerToolbar.tsx:90) - 输入工具栏组件（已集成草稿功能）
- [`ComposerInput`](../src/components/composer/ComposerInput.tsx:90) - 输入框组件
- [`ComposerWithSend`](../src/components/composer/ComposerWithSend.tsx:35) - 带发送功能的组件
- [`useSendMessage`](../src/hooks/use-send-message.hook.ts:1) - 发送消息 Hook
- [`OfflineMessageQueueService`](../src/services/offline-message-queue.service.ts:19) - 离线消息队列服务

## 当前状态

**As-Is（当前已实现）**：

- ✅ Hook 已实现并导出
- ✅ 支持所有核心功能
- ✅ 完整的 TypeScript 类型定义
- ✅ 集成到 [`ComposerToolbar`](../src/components/composer/ComposerToolbar.tsx:90) 组件
- ✅ 单元测试覆盖
- ✅ Storybook 示例

**To-Be（目标架构）**：

- 持续优化用户体验
- 补充更多使用场景示例
