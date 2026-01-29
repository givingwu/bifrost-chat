# 渲染层规范

## 顶部工具栏 (ChannelToolsList)

- 按钮来源：`strategy.allowedChannels`。
- 状态来源：`state.currentStatus`。

```tsx
const ChannelToolbar = () => {
  const { channels, status } = useStore(selector);

  return (
    <div className="toolbar">
      {channels.map(channel => (
        <ChannelButtonFactory
          key={channel}
          type={channel}
          disabled={isDisabled(channel, status)}
        />
      ))}
    </div>
  );
};
```

## 中间消息流 (ChatMessageList)

- 使用渲染工厂：类型映射 + 策略模式。
- 高性能滚动：优先 react-virtuoso 或 react-window。

```tsx
const BubbleMap = {
  text: TextBubble,
  image: ImageBubble,
  audio: AudioPlayerBubble,
  template: WhatsAppTemplateBubble,
  call_log: CallSystemMessage,
};

const MessageRendererFactory = ({ message }) => {
  const Component = BubbleMap[message.type] || UnsupportBubble;
  return <Component data={message} isSelf={message.direction === 'outbound'} />;
};
```

### 状态处理

- Sending：半透明 + Loading。
- Failed：红色感叹号 + 重试按钮。
- Read：WhatsApp 可双蓝勾，其他渠道按策略决定。

## 输入框 (Composer Strategy)

- SMS：禁视频、禁富文本，显示字符与计费。
- WhatsApp：允许图片/文件，显示模板选择。
- Email：富文本编辑器 (Subject + Body)。

## 右侧上下文 (ContextPanel)

- Tabs：Profile / Templates / Other。
- 模板点击：`useStore.getState().setInputText(templateContent)`。
