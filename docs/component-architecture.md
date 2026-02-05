# 组件架构（v3）

## 1. 组件分层

- 容器级：`ChatContainer`、`DefaultChatLayout`
- 业务级：`ConversationList`、`ChatMessageList`、`ComposerToolbar`
- 辅助级：`Profile`、`TemplateList/TemplatePicker`、`ThemeSwitcher` 等

## 2. 组件职责

| 组件 | 只做什么 | 不做什么 |
|---|---|---|
| ChatContainer | 组织 Provider、注入 i18n/theme 上下文 | 不直接请求服务端 |
| ConversationList | 展示会话与选择态 | 不管理后端分页策略 |
| ChatMessageList | 展示消息流与滚动触发 | 不解析协议包 |
| ComposerToolbar | 输入与发送交互 | 不包含后端发送逻辑 |
| TemplatePicker | 模板选择与变量输入 | 不直接请求模板 API |

## 3. 数据来源映射

- 会话列表：`useConversations`
- 消息列表：`useMessages`
- 模板列表：`useTemplates`
- 本地 UI：`useChatStore`（Zustand）

## 4. 交互基线

- 选择模板 -> 写入 `composerText` 或模板变量草稿（Zustand）
- 发送模板 -> mutation -> 刷新 `messages`
- 切换会话 -> 更新 `activeConversationId`（UI 选择）+ 触发消息查询

## 5. 扩展规范

新增消息类型：

1. 扩展 `MessageTypeEnum`
2. 新增对应消息组件
3. 注册到 `MessageRendererFactory`
4. 增加 Storybook stories

新增模板能力：

1. 扩展 `ITemplateService` 参数类型
2. 新增模板相关 hooks
3. 增加组件交互态与测试
