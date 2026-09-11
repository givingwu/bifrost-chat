# 命名规范（v3.1）

> **状态**：生效中 | **更新日期**：2026-03-09 | **最后审查**：2026-03-09

## 1. 术语红线

- 公开 API 必须使用 `Conversation`，禁止 `Session`。
- 统一写作“模板（Template）”，禁止同音错别字混写。
- Provider 统一命名为 `QueryProvider`。

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

### 3.1 组件

- 组件：PascalCase
- 示例：`Topbar`、`AudioMessage`、`TemplatePanel`

### 3.2 Hook

- Hook：`use*`
- 示例：`useConversations`、`useMessages`、`useSendMessage`

禁止示例：

- `useSessions`

## 4. 字段命名

- 会话标识：`conversationId`
- 禁止公开字段：`sessionId`

## 5. QueryKey 命名

- 会话：`conversations`
- 消息：`messages`
- 模板：`templates`

禁止：`sessions`

## 6. 导出规范

- 对外入口统一 `src/index.ts`。
- 组件导出统一 `src/components/index.ts`。
- 文档中的 API 清单只能引用公开导出符号。

## 7. 迁移对照

```tsx
// 旧写法（禁用）
import { useSessions } from '@feoe/bifrost-chat';

// 新写法（公开导出）
import { useConversations } from '@feoe/bifrost-chat';
```
