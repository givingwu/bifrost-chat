# useComposerDraft vs OfflineMessageQueueService 对比分析

## 核心区别

虽然两者都涉及消息的持久化存储，但它们解决的是**不同层面**的问题：

| 维度 | useComposerDraft | OfflineMessageQueueService |
|------|------------------|---------------------------|
| **解决问题** | 用户输入体验 | 网络离线可靠性 |
| **存储内容** | 未完成的输入内容 | 已提交但未发送的消息 |
| **存储时机** | 输入过程中（防抖） | 发送失败时 |
| **恢复时机** | 组件挂载时 | 网络恢复时 |
| **存储位置** | localStorage | IndexedDB / localStorage |
| **数据结构** | 简单字符串 | 复杂消息对象 |
| **生命周期** | 临时草稿 | 离线队列 |

## 详细对比

### 1. useComposerDraft - 输入草稿

**用途**：提升用户输入体验

**场景**：
- 用户正在输入消息，但还没有点击发送
- 用户切换标签页或刷新页面
- 用户关闭浏览器，下次回来时恢复输入

**数据流**：
```
用户输入 → 防抖保存 → localStorage
    ↓
组件挂载 → 加载草稿 → 恢复输入框
```

**存储内容**：
```typescript
// 简单的字符串
"Hello, this is my draft message..."
```

**特点**：
- ✅ 轻量级：只存储文本内容
- ✅ 实时性：输入时自动保存
- ✅ 用户体验：防止意外丢失输入
- ❌ 不处理发送逻辑
- ❌ 不处理网络状态

### 2. OfflineMessageQueueService - 离线消息队列

**用途**：保证消息发送可靠性

**场景**：
- 用户点击发送，但网络断开
- 服务器暂时不可用
- 需要重试发送失败的消息

**数据流**：
```
用户点击发送 → 尝试发送 → 失败 → 入队
    ↓
网络恢复 → 出队 → 重试发送 → 成功/失败
```

**存储内容**：
```typescript
// 复杂的消息对象
{
  id: 'msg-123',
  message: {
    type: 'text',
    content: 'Hello',
    // ... 完整消息结构
  },
  conversationId: 'conv-456',
  sendParams: { /* 发送参数 */ },
  retryCount: 0,
  maxRetries: 3,
  createdAt: 1234567890,
  priority: 'normal',
  nextRetryAt: 1234567890,
}
```

**特点**：
- ✅ 完整性：存储完整消息结构
- ✅ 可靠性：支持重试机制
- ✅ 优先级：支持消息优先级
- ✅ 统计：提供队列统计信息
- ✅ 订阅：支持队列变化订阅
- ❌ 重量级：需要更多存储空间
- ❌ 复杂度：需要管理队列状态

## 使用场景对比

### 场景 1：用户正在输入消息

```
用户输入： "Hello, how are you?"
         ↓
[useComposerDraft] 自动保存到 localStorage
         ↓
用户刷新页面
         ↓
[useComposerDraft] 恢复输入内容
```

**使用**：`useComposerDraft`

### 场景 2：用户点击发送，但网络断开

```
用户点击发送
         ↓
尝试发送 → 失败（网络错误）
         ↓
[OfflineMessageQueueService] 入队
         ↓
网络恢复
         ↓
[OfflineMessageQueueService] 自动重试
         ↓
发送成功 → 出队
```

**使用**：`OfflineMessageQueueService`

### 场景 3：用户正在输入，突然网络断开

```
用户输入： "I'm typing..."
         ↓
[useComposerDraft] 自动保存到 localStorage
         ↓
用户点击发送 → 失败（网络错误）
         ↓
[OfflineMessageQueueService] 入队
         ↓
[useComposerDraft] 清除草稿（已尝试发送）
```

**使用**：两者配合使用

## 架构定位

### useComposerDraft - UI 层

```
┌─────────────────────────────────┐
│     ComposerToolbar 组件        │
│                                 │
│  ┌───────────────────────────┐ │
│  │   useComposerDraft Hook   │ │ ← UI 层
│  │   (输入草稿管理)           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │   ComposerInput 组件      │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

**职责**：
- 管理输入框的临时状态
- 提供草稿恢复功能
- 提升用户体验

### OfflineMessageQueueService - 服务层

```
┌─────────────────────────────────┐
│      应用层 (App Layer)         │
│                                 │
│  ┌───────────────────────────┐ │
│  │  useSendMessage Hook      │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│      服务层 (Service Layer)     │
│                                 │
│  ┌───────────────────────────┐ │
│  │ OfflineMessageQueueService│ │ ← 服务层
│  │ (离线消息队列管理)         │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│      存储层 (Storage Layer)     │
│                                 │
│  ┌───────────────────────────┐ │
│  │  IndexedDB / localStorage │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

**职责**：
- 管理离线消息队列
- 处理发送失败重试
- 保证消息可靠性

## 配合使用示例

### 完整的消息发送流程

```typescript
function ComposerWithDraftAndOffline({ conversationId }: Props) {
  const [message, setMessage] = useState('');

  // 1. 草稿管理（UI 层）
  const { loadDraft, clearDraft } = useComposerDraft(
    `conversation-${conversationId}`,
    message
  );

  // 2. 离线队列（服务层）
  const offlineQueue = useOfflineMessageQueue();
  const sendMessage = useSendMessage();

  // 初始化时加载草稿
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setMessage(draft);
    }
  }, [loadDraft]);

  // 发送消息
  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      // 尝试发送
      await sendMessage.mutateAsync({
        conversationId,
        content: message,
      });

      // 发送成功
      setMessage('');
      clearDraft(); // 清除草稿
    } catch (error) {
      // 发送失败，加入离线队列
      await offlineQueue.enqueue({
        id: generateId(),
        message: {
          type: 'text',
          content: message,
        },
        conversationId,
        retryCount: 0,
        maxRetries: 3,
        createdAt: Date.now(),
        priority: 'normal',
      });

      // 注意：这里不清除草稿，因为消息还未真正发送
      // 用户可以选择重试或编辑
    }
  };

  return (
    <ComposerToolbar
      value={message}
      onChange={setMessage}
      onSend={handleSend}
    />
  );
}
```

## 存储策略对比

### useComposerDraft 存储策略

```typescript
// localStorage 键名
'bifrost-chat-draft-conversation-123'

// 存储内容
"Hello, this is my draft message..."

// 存储时机
- 防抖 500ms 后自动保存
- 组件卸载时可选保存

// 清理时机
- 发送成功后清除
- 用户手动丢弃
- 组件卸载时（可选）
```

### OfflineMessageQueueService 存储策略

```typescript
// IndexedDB / localStorage
// 数据库：bifrost-offline-queue
// 表：offline_messages

// 存储内容
{
  id: 'msg-123',
  message: { /* 完整消息对象 */ },
  conversationId: 'conv-456',
  sendParams: { /* 发送参数 */ },
  retryCount: 0,
  maxRetries: 3,
  createdAt: 1234567890,
  priority: 'normal',
  nextRetryAt: 1234567890,
}

// 存储时机
- 发送失败时入队

// 清理时机
- 发送成功后出队
- 达到最大重试次数后失败
- 消息过期后清理
```

## 性能对比

### useComposerDraft

- **存储速度**：快（localStorage 同步 API）
- **存储容量**：小（5-10MB 限制）
- **内存占用**：小（只存储当前草稿）
- **查询性能**：不适用（只存储单个值）

### OfflineMessageQueueService

- **存储速度**：中等（IndexedDB 异步 API）
- **存储容量**：大（IndexedDB 可达数百 MB）
- **内存占用**：中等（缓存队列消息）
- **查询性能**：好（支持索引查询）

## 何时使用哪个？

### 使用 useComposerDraft 当：

✅ 需要保存用户未完成的输入
✅ 需要在页面刷新后恢复输入
✅ 需要提升用户输入体验
✅ 数据量小（只存储文本）

### 使用 OfflineMessageQueueService 当：

✅ 需要处理发送失败的消息
✅ 需要在网络恢复后重试
✅ 需要保证消息可靠性
✅ 需要管理大量离线消息

### 同时使用两者当：

✅ 需要完整的离线消息解决方案
✅ 需要既保护输入体验又保证发送可靠性
✅ 需要处理复杂的离线场景

## 推荐架构

```
┌─────────────────────────────────────────────┐
│           ComposerToolbar 组件              │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │     useComposerDraft Hook             │ │
│  │     (输入草稿管理)                     │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │     ComposerInput 组件                │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         useSendMessage Hook                 │
│         (发送消息逻辑)                       │
└─────────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
    ┌─────────┐          ┌──────────────────┐
    │ 发送成功 │          │ 发送失败          │
    └─────────┘          └──────────────────┘
                                ↓
    ┌──────────────────────────────────────────┐
    │   OfflineMessageQueueService             │
    │   (离线消息队列管理)                      │
    └──────────────────────────────────────────┘
```

## 总结

| 特性 | useComposerDraft | OfflineMessageQueueService |
|------|------------------|---------------------------|
| **定位** | UI 体验工具 | 可靠性服务 |
| **层级** | Hook（UI 层） | Service（服务层） |
| **复杂度** | 简单 | 复杂 |
| **存储** | localStorage | IndexedDB / localStorage |
| **用途** | 草稿恢复 | 离线重试 |
| **关系** | 独立使用 | 可配合使用 |

**结论**：两者解决不同层面的问题，可以配合使用提供完整的离线消息解决方案。

- `useComposerDraft`：保护用户输入，提升体验
- `OfflineMessageQueueService`：保证消息发送，提升可靠性

推荐在 [`ComposerToolbar`](src/components/composer/ComposerToolbar.tsx:90) 中集成 `useComposerDraft`，同时保持 `OfflineMessageQueueService` 在发送失败时处理离线队列。
