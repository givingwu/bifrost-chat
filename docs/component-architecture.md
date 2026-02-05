# Bifrost-Chat 组件架构设计

> 本文是 UI 渲染层与逻辑层（ClientBus/Store/DataLayer/NetLayer）的对齐说明，统一组件职责、Props 输入与状态来源。

## 1. 设计目标

- 组件结构清晰：容器组件负责状态绑定，展示组件负责 UI。
- 状态来源统一：所有 UI 状态来自 Store/策略与网络层。
- 扩展可控：新增渠道、主题、输入策略只需在策略/工厂层扩展。

## 2. 组件层级

```
ChatContainer
└── ChatTopbar
    ├── ChannelToolsList
    ├── NetworkStatus
    └── ThemeSwitcher
└── ChatLayout (三栏布局容器)
    ├── ConversationList
    ├── ChatMessageList
    ├── ComposerToolbar
    ├── Profile
    └── Template
```

## 3. 组件职责与 Props

### 3.1 ChatContainer

- **职责**：SDK 根容器，初始化 Provider，绑定 Store。
- **输入**：locale/messages/channels/onChannelClick/onThemeChange。
- **输出**：渲染 ChatTopbar + ChatLayout（支持 conversation/context/composer 插槽）。

### 3.2 ChatTopbar

- **职责**：顶部工具栏（左渠道，右网络/主题）。
- **输入**：channels/status/networkStatus/themeMode/title/subtitle/avatarUrl。
- **输出**：ChannelToolsList + NetworkStatus + ThemeSwitcher。

### 3.3 ChannelToolsList

- **职责**：根据策略渲染渠道按钮。
- **输入**：strategy.allowedChannels + strategy.agentStatus。

### 3.4 NetworkStatus

- **职责**：展示 NetLayer 连接状态。
- **输入**：network.status（connected/disconnected/connecting）。

### 3.5 ThemeSwitcher

- **职责**：主题切换（system/light/dark）。
- **输入**：theme.mode。
- **输出**：触发 store.actions.setTheme。

## 4. 与逻辑层映射

| UI 组件 | Store/逻辑来源 | 说明 |
| --- | --- | --- |
| ChatContainer | Store + Provider | 根容器绑定策略与主题状态。
| ChatTopbar | Store.strategy / Store.network / Store.theme | 顶部栏状态展示。
| ChannelToolsList | Strategy Slice | 渠道渲染 + 互斥逻辑。
| NetworkStatus | NetLayer -> Store.network | 连接管理器写入 Store。
| ThemeSwitcher | Theme Slice | UI 触发 -> Store 更新。
| ChatMessageList | DataLayer -> Store.conversation | 标准化消息流渲染。
| ComposerToolbar | Strategy Slice | 按渠道切换输入能力，UI 对齐 DEMO。
| Profile | Profile Slice | 默认模板 + 自定义渲染。 | ConversationList | Conversation Slice | 会话列表展示与切换。

## 5. 关键数据流

- **网络状态**：NetLayer/ConnectionManager -> Store.network.status -> NetworkStatus。
- **主题切换**：ThemeSwitcher -> Store.actions.setTheme -> data-theme attribute。
- **渠道切换**：Host -> Store.strategy.allowedChannels -> ChannelToolsList。

## 6. 组件扩展规范

- 新渠道：新增 Adapter/Mapper，并在 ChannelToolsList/ChannelButtonFactory 注册。
- 新主题：在 theme.css 增加 token，并扩展 ThemeSwitcher 枚举。
- 新消息类型：在 MessageRendererFactory 的 BubbleMap 增加映射。