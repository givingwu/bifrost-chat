# 组件架构（v3.1）

## 1. 当前已实现（As-Is）

### 1.1 组件分层

- 容器级：`ChatContainer`、`DefaultChatLayout`
- 布局级：`ChatLayout`、`MobileLayout`、`Topbar`、`TopbarTools`
- 业务级：`ConversationList`、`InfiniteMessageList`、`Composer`、
  `ComposerToolbar`
- 上下文级：`Profile`、`TemplatePanel`
- 基础级：`Avatar`、`Button`、`IconButton` 等

### 1.2 组件职责

| 组件 | 只做什么 | 不做什么 |
|---|---|---|
| ChatContainer | 组织 I18n 与主题容器，消费 Store | 不直接请求服务端 |
| DefaultChatLayout | 组合默认聊天页面与交互 | 不实现宿主协议适配 |
| MobileLayout | 组合移动端 Header、消息区、底部输入与模板 ActionSheet | 不实现宿主协议适配 |
| ConversationList | 渲染会话列表与选择态 | 不管理后端分页策略 |
| InfiniteMessageList | 渲染消息流与无限滚动 | 不解析原始协议包 |
| Composer/ComposerToolbar | 输入、草稿、附件、语音与发送交互 | 不直连后端 API |
| TemplatePanel | 模板筛选与选择 | 不直连模板 API（默认用 hooks） |

### 1.3 数据来源映射

- 会话列表：`useConversations`
- 消息列表：`useMessages`
- 模板列表：`useTemplates`
- 模板预览：`useTemplatePreview`
- 发送消息：`useSendMessage`
- 消息类型策略：`useMessageTypeConfig`
- 本地 UI 状态：`useChatStore` 与子选择器
- 草稿状态：`useComposerDraftStore`

### 1.4 模板链路（当前）

- `TemplatePanel` 或 `MobileTemplateActionSheet` 触发 `useTemplateSelect`。
- `useTemplateSelect` 调用 `useTemplatePreview` 获取预览内容与参数。
- `composer.templateMode='direct'` 时直接调用 `useSendMessage`。
- `composer.templateMode='edit'` 时回填 Composer 草稿，后续发送仍走
  `useSendMessage`。

## 2. 目标架构（To-Be）

- 新增独立模板发送 mutation（如 `useSendTemplateMessage`）。
- 保持 `src/components/template/` 与 `src/components/profile/` 边界。

## 3. 扩展规范

新增消息类型：

1. 扩展 `MessageTypeEnum`
2. 新增消息组件
3. 注册到 `MessageRendererFactory`
4. 增加 Storybook stories 与测试

新增模板能力：

1. 扩展 `ITemplateService` 参数类型
2. 新增模板相关 hooks
3. 增加组件交互态与测试
