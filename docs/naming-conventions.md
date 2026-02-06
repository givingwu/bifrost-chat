# 命名规范（v4）

## 1. 术语红线

- 公开 API 必须使用 `Conversation`，禁止 `Session`。
- 模板统一写作"模板（Template）"，禁止"模版"混写。

## 2. 类型命名

- 数据类型：`*Data`
- 组件参数：`*Props`
- 枚举：`*Enum`
- 配置：`*Config`
- 选项：`*Options`

示例：

```ts
interface ConversationData {}
interface ComposerToolbarProps {}
enum MessageStatusEnum {}
interface SDKConfig {}
interface SendMessageOptions {}
```

## 3. 组件与 Hook 命名

### 3.1 基本规则

- 组件：PascalCase（`ConversationList`）
- Hook：`use*`（`useConversations`）
- 禁止：`useSessions`、`SessionList`

### 3.2 Container 组件命名

**原则**：避免使用 `Container` 后缀，优先使用功能描述性名称。

| 旧命名（不推荐） | 新命名（推荐） | 理由 |
|-----------------|---------------|------|
| `ConversationListContainer` | `ConversationList` | 简单数据获取，直接合并 |
| `ChatMessageListContainer` | `InfiniteMessageList` | 强调无限滚动特性 |
| `ComposerToolbarContainer` | `ComposerWithSend` | 明确发送功能 |
| `DefaultChatLayoutContainer` | `DefaultChatLayout` | 去掉冗余后缀 |

**例外情况**：
- 如果组件职责复杂且需要明确区分，可以使用功能描述性名称
- 保持向后兼容时，可以导出别名（如 `export const ChatMessageList = MessageList`）

### 3.3 组件命名示例

```tsx
// ✅ 好的命名
<ConversationList />        // 清晰明确
<InfiniteMessageList />     // 强调特性
<ComposerWithSend />        // 功能描述
<TemplateSearch />          // 职责明确

// ❌ 避免的命名
<ChatMessageList />         // Chat 前缀冗余（已废弃）
<ConversationListContainer /> // Container 后缀不必要
<ProfileSearch />           // 命名与职责不符（应为 TemplateSearch）
```

## 4. 字段命名

- 会话标识：`conversationId`
- 禁止公开字段：`sessionId`

## 5. QueryKey 命名

- 会话：`conversations`
- 消息：`messages`
- 模板：`templates`

禁止：`sessions`

## 6. 导出规范

- 类型导出使用 `export type`
- 组件导出使用命名导出
- 对外入口统一在 `src/index.ts`
- 向后兼容时可以导出别名（如 `export const ChatMessageList = MessageList`）

## 7. 迁移指南

### 从 v3 升级到 v4

1. **Container 组件重命名**：
   ```tsx
   // 旧代码
   import { ConversationListContainer } from '@feoe/bifrost-chat';

   // 新代码
   import { ConversationList } from '@feoe/bifrost-chat';
   ```

2. **ChatMessageList 重命名**：
   ```tsx
   // 旧代码
   import { ChatMessageList } from '@feoe/bifrost-chat';

   // 新代码（推荐）
   import { MessageList } from '@feoe/bifrost-chat';
   ```

3. **ProfileSearch 重命名**：
   ```tsx
   // 旧代码
   import { ProfileSearch } from '@feoe/bifrost-chat';

   // 新代码
   import { TemplateSearch } from '@feoe/bifrost-chat';
   ```
