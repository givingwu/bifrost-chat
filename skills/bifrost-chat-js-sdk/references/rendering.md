# 渲染层规范（统一术语）

## 1) 当前组件分工

- 顶层容器：`ChatContainer`（I18n + Store 上下文）
- 默认布局：`DefaultChatLayout`（Topbar/会话区/消息区/输入区/Profile）
- 渠道工具栏：`ChannelFilter` + `ChannelButtonFactory`
- 消息流：`ChatMessageList` + `MessageRendererFactory`
- 输入区：`ComposerToolbar`

## 2) 渠道按钮策略

约束：渠道来源必须来自策略状态，而不是硬编码。

当前注意点：

- 默认布局中 `ChannelFilter` 仍使用 `AvailableChannelTypes`。
- 目标态应优先读取 `strategy.allowedChannels`，并结合坐席状态做互斥（如 in_call）。

## 3) 消息渲染策略

- 渲染入口：`MessageRendererFactory`
- 当前实现：`Other` 类型渲染系统气泡，其余走 `MessageBubble`
- 类型源：`MessageTypeEnum`
- 方向源：`MessageDirectionEnum`（incoming/outgoing）

建议：

- 避免在组件内部硬编码协议字段；只消费标准消息。
- 新增消息类型时，先补类型与组件，再补工厂映射和 Storybook stories。

## 4) 输入区策略

`ComposerToolbar` 已按渠道做差异化：

- 长度限制（SMS/WhatsApp/Waba/默认）
- 附件 accept 白名单
- 占位文案按渠道变化

扩展建议：

- Email 富文本、模板先修流程可继续在该层扩展，但需保持 props 简洁。
- 避免把业务规则写进 UI，交给上层 action 或 service hooks。

## 5) 性能与可访问性

- 当前消息列表是直接渲染；会话量增大时建议接入虚拟滚动。
- 交互组件需保留语义属性与可键盘操作能力。
- Storybook 中至少覆盖：默认态、异常态、空态、禁用态。
