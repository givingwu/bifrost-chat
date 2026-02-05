# 命名规范（v3）

## 1. 术语红线

- 公开 API 必须使用 `Conversation`，禁止 `Session`。
- 模板统一写作“模板（Template）”，禁止“模版”混写。

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

- 组件：PascalCase（`ConversationList`）
- Hook：`use*`（`useConversations`）
- 禁止：`useSessions`、`SessionList`

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
