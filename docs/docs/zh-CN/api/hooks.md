# Hooks API 参考

## 当前已实现（As-Is）

以下 Hooks 已从 `@feoe/bifrost-chat` 公开导出。

## 目标架构（To-Be）

- 补充更多场景化 Hooks（如离线消息同步、重试策略）。

---

## 会话相关 Hooks

### useConversations

查询会话列表。

```tsx
import { useConversations } from '@feoe/bifrost-chat';

function MyComponent() {
  const { data, isLoading, error, refetch } = useConversations();
  
  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;
  
  return (
    <ul>
      {data?.map(conversation => (
        <li key={conversation.id}>{conversation.name}</li>
      ))}
    </ul>
  );
}
```

**返回值**

| 字段 | 类型 | 说明 |
|---|---|---|
| `data` | `Conversation[] \| undefined` | 会话列表 |
| `isLoading` | `boolean` | 是否正在加载 |
| `error` | `Error \| null` | 错误信息 |
| `refetch` | `() => void` | 重新获取 |

### useCreateConversation

创建新会话。

```tsx
import { useCreateConversation } from '@feoe/bifrost-chat';

function MyComponent() {
  const { mutate, isPending } = useCreateConversation();
  
  const handleCreate = () => {
    mutate({
      name: '新会话',
      // 其他参数...
    }, {
      onSuccess: (conversation) => {
        console.log('创建成功', conversation.id);
      },
    });
  };
  
  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? '创建中...' : '创建会话'}
    </button>
  );
}
```

### useMarkAsRead

标记消息已读。

```tsx
import { useMarkAsRead } from '@feoe/bifrost-chat';

function MyComponent() {
  const { mutate } = useMarkAsRead();
  
  const handleMarkRead = (conversationId: string, messageId: string) => {
    mutate({ conversationId, messageId });
  };
  
  return <button onClick={() => handleMarkRead('conv-1', 'msg-1')}>标记已读</button>;
}
```

---

## 消息相关 Hooks

### useMessages

查询消息列表。

```tsx
import { useMessages } from '@feoe/bifrost-chat';

function MyComponent({ conversationId }: { conversationId: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(conversationId);
  
  return (
    <div>
      {data?.pages.flat().map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>加载更多</button>
      )}
    </div>
  );
}
```

**参数**

| 字段 | 类型 | 说明 |
|---|---|---|
| `conversationId` | `string` | 会话 ID |

**返回值**

| 字段 | 类型 | 说明 |
|---|---|---|
| `data` | `InfiniteData<StandardMessage[]>` | 分页消息数据 |
| `isLoading` | `boolean` | 是否正在加载 |
| `fetchNextPage` | `() => void` | 加载下一页 |
| `hasNextPage` | `boolean` | 是否有下一页 |

### useSendMessage

发送消息。

```tsx
import { useSendMessage } from '@feoe/bifrost-chat';

function MyComponent({ conversationId }: { conversationId: string }) {
  const { mutate, isPending } = useSendMessage(conversationId);
  
  const handleSend = (content: string) => {
    mutate({
      content,
      type: 'text',
    }, {
      onSuccess: (result) => {
        console.log('发送成功', result.messageId);
      },
    });
  };
  
  return (
    <button onClick={() => handleSend('Hello')} disabled={isPending}>
      发送
    </button>
  );
}
```

---

## 模板相关 Hooks

### useTemplates

查询模板列表。

```tsx
import { useTemplates } from '@feoe/bifrost-chat';

function MyComponent() {
  const { data, isLoading } = useTemplates({
    channelId: 'whatsapp',
    category: 'marketing',
  });
  
  return (
    <ul>
      {data?.map(template => (
        <li key={template.id}>{template.name}</li>
      ))}
    </ul>
  );
}
```

---

## 工具 Hooks

### useInViewport

检测元素是否在视口内。

```tsx
import { useInViewport } from '@feoe/bifrost-chat';

function MyComponent() {
  const { ref, isInViewport } = useInViewport();
  
  return (
    <div ref={ref}>
      {isInViewport ? '在视口内' : '不在视口内'}
    </div>
  );
}