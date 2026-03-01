# Hooks API Reference

## Current Implementation (As-Is)

The following Hooks are publicly exported from `@feoe/bifrost-chat`.

## Target Architecture (To-Be)

- Add more scenario-based Hooks (e.g., offline message sync, retry strategies).

---

## Conversation Hooks

### useConversations

Query conversation list.

```tsx
import { useConversations } from '@feoe/bifrost-chat';

function MyComponent() {
  const { data, isLoading, error, refetch } = useConversations();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;
  
  return (
    <ul>
      {data?.map(conversation => (
        <li key={conversation.id}>{conversation.name}</li>
      ))}
    </ul>
  );
}
```

**Return Values**

| Field | Type | Description |
|---|---|---|
| `data` | `Conversation[] \| undefined` | Conversation list |
| `isLoading` | `boolean` | Is loading |
| `error` | `Error \| null` | Error info |
| `refetch` | `() => void` | Refetch data |

### useCreateConversation

Create a new conversation.

```tsx
import { useCreateConversation } from '@feoe/bifrost-chat';

function MyComponent() {
  const { mutate, isPending } = useCreateConversation();
  
  const handleCreate = () => {
    mutate({
      name: 'New Conversation',
      // other params...
    }, {
      onSuccess: (conversation) => {
        console.log('Created', conversation.id);
      },
    });
  };
  
  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Conversation'}
    </button>
  );
}
```

### useMarkAsRead

Mark messages as read.

```tsx
import { useMarkAsRead } from '@feoe/bifrost-chat';

function MyComponent() {
  const { mutate } = useMarkAsRead();
  
  const handleMarkRead = (conversationId: string, messageId: string) => {
    mutate({ conversationId, messageId });
  };
  
  return <button onClick={() => handleMarkRead('conv-1', 'msg-1')}>Mark as Read</button>;
}
```

---

## Message Hooks

### useMessages

Query message list.

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
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

**Parameters**

| Field | Type | Description |
|---|---|---|
| `conversationId` | `string` | Conversation ID |

**Return Values**

| Field | Type | Description |
|---|---|---|
| `data` | `InfiniteData<StandardMessage[]>` | Paginated message data |
| `isLoading` | `boolean` | Is loading |
| `fetchNextPage` | `() => void` | Fetch next page |
| `hasNextPage` | `boolean` | Has next page |

### useSendMessage

Send a message.

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
        console.log('Sent', result.messageId);
      },
    });
  };
  
  return (
    <button onClick={() => handleSend('Hello')} disabled={isPending}>
      Send
    </button>
  );
}
```

---

## Template Hooks

### useTemplates

Query template list.

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

## Utility Hooks

### useInViewport

Detect if element is in viewport.

```tsx
import { useInViewport } from '@feoe/bifrost-chat';

function MyComponent() {
  const { ref, isInViewport } = useInViewport();
  
  return (
    <div ref={ref}>
      {isInViewport ? 'In viewport' : 'Not in viewport'}
    </div>
  );
}