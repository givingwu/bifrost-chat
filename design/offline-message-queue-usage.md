# 离线消息队列使用指南

## 文档版本

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2026-02-07 | Kilo Code | 初始版本 |
| 1.1.0 | 2026-06-02 | Codex | 对齐当前包入口导出与 hooks |

---

## 概述

离线消息队列系统确保发送失败的消息不会丢失，并在网络恢复时自动重试发送。

### 当前已实现（As-Is）

- ✅ IndexedDB 持久化存储
- ✅ 自动重试机制（网络恢复时）
- ✅ 手动重试功能
- ✅ 消息优先级支持
- ✅ 重试策略配置（指数退避/线性/固定）
- ✅ 队列状态订阅
- ✅ `ServiceProvider` 注入 `offlineMessageQueue`
- ✅ `useOfflineSync` / `useRetryMessage` / `useDeleteFailedMessage`
  从包入口公开导出

### 目标架构（To-Be）

- [ ] 从包入口公开 `OfflineMessageQueueService` 或提供稳定的队列接口类型
- [ ] 跨标签页同步
- [ ] 消息去重
- [ ] 消息合并（批量发送）
- [ ] 云端备份
- [ ] `OfflineMessageProvider` 便捷注入层
- [ ] `OfflineQueueIndicator` / `useOfflineQueueIndicator` 内建 UI 状态组件

---

## 快速开始

### 1. 启用离线消息队列

当前版本通过 `ServiceProvider` 直接注入 `offlineMessageQueue`：

```tsx
import { ServiceProvider } from '@feoe/bifrost-chat';

const offlineMessageQueue = createHostOfflineMessageQueue({
  maxQueueSize: 500,
  messageExpiration: 3 * 24 * 60 * 60 * 1000,
  defaultMaxRetries: 3,
  retryStrategy: 'exponential',
});

void offlineMessageQueue.initialize();

function App() {
  return (
    <ServiceProvider
      conversationService={myConversationService}
      messageService={myMessageService}
      templateService={myTemplateService}
      offlineMessageQueue={offlineMessageQueue}
    >
      <ChatApp />
    </ServiceProvider>
  );
}
```

说明：`ServiceProvider.offlineMessageQueue` 已支持注入；但当前包入口未公开
内置 `OfflineMessageQueueService` 类。npm 接入方应注入宿主侧同形队列实现，
或在内部工程中自行封装仓库内实现。

### 2. 在工具栏中显示队列状态

> To-Be：当前版本没有内建 `OfflineQueueIndicator` /
> `useOfflineQueueIndicator`。请基于 `offlineMessageQueue.subscribe`
> 自行实现状态展示。

```tsx
import { useEffect, useState } from 'react';
import { useServices } from '@feoe/bifrost-chat';

function OfflineQueueBadge() {
  const { offlineMessageQueue } = useServices();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!offlineMessageQueue) return;

    return offlineMessageQueue.subscribe((messages) => {
      setCount(messages.length);
    });
  }, [offlineMessageQueue]);

  if (count === 0) return null;

  return <span className="badge">{count}</span>;
}
```

### 3. 在消息气泡中添加重试按钮

```tsx
import { MessageStatusEnum, useRetryMessage } from '@feoe/bifrost-chat';

function MessageBubble({ message }) {
  const retryMessage = useRetryMessage();

  return (
    <div className="message-bubble">
      {/* 消息内容 */}
      <div>{message.content.text}</div>

      {/* 失败消息的重试按钮 */}
      {message.status === MessageStatusEnum.Failed && (
        <button
          onClick={() => {
            if (!message._offlineMessageId) return;
            retryMessage.mutate({
              conversationId: message.conversationId,
              offlineMessageId: message._offlineMessageId,
            });
          }}
          disabled={!message._offlineMessageId || retryMessage.isPending}
          className="retry-button"
        >
          {retryMessage.isPending ? '重试中...' : '重试'}
        </button>
      )}
    </div>
  );
}
```

### 4. 手动触发同步

```tsx
import { useOfflineSync } from '@feoe/bifrost-chat';

function SyncButton() {
  const { sync, isSyncing } = useOfflineSync();

  return (
    <button onClick={sync} disabled={isSyncing}>
      {isSyncing ? '同步中...' : '立即同步'}
    </button>
  );
}
```

---

## 配置选项

### OfflineQueueConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用离线队列 |
| `dbName` | `string` | `'bifrost-offline-queue'` | IndexedDB 数据库名称 |
| `dbVersion` | `number` | `1` | 数据库版本 |
| `maxQueueSize` | `number` | `1000` | 最大队列长度 |
| `messageExpiration` | `number` | `7 * 24 * 60 * 60 * 1000` | 消息过期时间（毫秒） |
| `defaultMaxRetries` | `number` | `3` | 默认最大重试次数 |
| `retryStrategy` | `'exponential' \| 'linear' \| 'fixed'` | `'exponential'` | 重试延迟策略 |
| `autoRetryOnReconnect` | `boolean` | `true` | 网络恢复时自动重试 |
| `batchSize` | `number` | `10` | 批量重试大小 |
| `fixedRetryDelay` | `number` | `5000` | 固定重试延迟（毫秒） |
| `linearRetryDelay` | `number` | `2000` | 线性重试延迟增量（毫秒） |
| `maxRetryDelay` | `number` | `30000` | 最大重试延迟（毫秒） |

### 重试策略说明

#### 指数退避（Exponential）

默认策略，重试延迟呈指数增长：

```
第 1 次重试：1 秒
第 2 次重试：2 秒
第 3 次重试：4 秒
第 4 次重试：8 秒
...
最大延迟：30 秒
```

#### 线性（Linear）

重试延迟线性增长：

```
第 1 次重试：1 秒
第 2 次重试：3 秒（1 + 2）
第 3 次重试：5 秒（1 + 2*2）
第 4 次重试：7 秒（1 + 2*3）
...
最大延迟：30 秒
```

#### 固定（Fixed）

每次重试使用固定延迟：

```
所有重试：5 秒
```

---

## API 参考

### Hooks

#### `useServices()`（As-Is）

通过依赖注入上下文获取离线队列服务实例。

```tsx
import { useServices } from '@feoe/bifrost-chat';

const { offlineMessageQueue } = useServices();
```

**返回值（离线队列相关）：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `offlineMessageQueue` | `OfflineMessageQueueService \| undefined` | 队列服务实例，未启用时为 `undefined` |

#### `useOfflineSync()`

监听网络状态并自动同步离线消息。

```tsx
const { sync, isSyncing, lastSyncAt } = useOfflineSync();
```

**返回值：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `sync` | `() => Promise<void>` | 手动触发同步 |
| `isSyncing` | `boolean` | 是否正在同步 |
| `lastSyncAt` | `number \| null` | 上次同步时间戳 |

#### `useRetryMessage()`

手动重试单条离线消息。

```tsx
import { useRetryMessage } from '@feoe/bifrost-chat';

const retryMessage = useRetryMessage();

await retryMessage.mutateAsync({
  conversationId,
  offlineMessageId,
});
```

**返回值：**

返回 React Query mutation 对象。mutation 参数为：

| 属性 | 类型 | 说明 |
|------|------|------|
| `conversationId` | `string` | 会话 ID |
| `offlineMessageId` | `string` | 离线队列消息 ID |

#### `useDeleteFailedMessage()`

删除本地失败消息。

```tsx
import { useDeleteFailedMessage } from '@feoe/bifrost-chat';

const deleteFailedMessage = useDeleteFailedMessage();

await deleteFailedMessage.mutateAsync({
  conversationId,
  offlineMessageId,
});
```

#### `useOfflineQueueIndicator()`（To-Be）

> 当前版本未提供该 Hook。
> 推荐使用 `offlineMessageQueue.subscribe` 自行封装。

### 组件

#### `<OfflineQueueIndicator />`（To-Be）

> 当前版本未提供该组件。
> 可在业务侧订阅队列长度后实现自定义徽标或状态提示。

### 服务

#### `OfflineMessageQueueService`

离线消息队列服务类。

**方法：**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initialize()` | - | `Promise<void>` | 初始化数据库 |
| `enqueue(message)` | `OfflineMessage` | `Promise<void>` | 将消息加入队列 |
| `dequeue(messageId)` | `string` | `Promise<void>` | 从队列中移除消息 |
| `getAll()` | - | `Promise<OfflineMessage[]>` | 获取所有消息 |
| `getByConversation(conversationId)` | `string` | `Promise<OfflineMessage[]>` | 获取指定会话的消息 |
| `getPendingRetry()` | - | `Promise<OfflineMessage[]>` | 获取需要重试的消息 |
| `update(messageId, updates)` | `string, Partial<OfflineMessage>` | `Promise<void>` | 更新消息 |
| `clear()` | - | `Promise<void>` | 清空队列 |
| `getStats()` | - | `Promise<OfflineQueueStats>` | 获取统计信息 |
| `cleanup(maxAge?)` | `number` | `Promise<number>` | 清理过期消息 |
| `subscribe(callback)` | `(messages) => void` | `() => void` | 订阅队列变化 |
| `destroy()` | - | `void` | 销毁服务 |
| `calculateNextRetry(retryCount)` | `number` | `number` | 计算下次重试时间 |
| `createOfflineMessage(...)` | `...` | `OfflineMessage` | 创建离线消息对象 |

---

## 高级用法

### 自定义重试逻辑

```tsx
import { useServices } from '@feoe/bifrost-chat';

function CustomRetry() {
  const { offlineMessageQueue: queueService } = useServices();

  const handleCustomRetry = async () => {
    if (!queueService) return;

    const messages = await queueService.getAll();

    // 只重试高优先级消息
    const highPriorityMessages = messages.filter(
      (m) => m.priority === 'urgent' || m.priority === 'high'
    );

    for (const msg of highPriorityMessages) {
      // 自定义重试逻辑
      await customRetryLogic(msg);
    }
  };

  return <button onClick={handleCustomRetry}>重试高优先级消息</button>;
}
```

### 监听队列变化

```tsx
import { useEffect } from 'react';
import { useServices } from '@feoe/bifrost-chat';

function QueueMonitor() {
  const { offlineMessageQueue: queueService } = useServices();

  useEffect(() => {
    if (!queueService) return;

    const unsubscribe = queueService.subscribe((messages) => {
      console.log('队列更新:', messages.length, '条消息');

      // 自定义逻辑
      if (messages.length > 10) {
        console.warn('离线队列积压过多');
      }
    });

    return unsubscribe;
  }, [queueService]);

  return null;
}
```

### 获取队列统计信息

```tsx
import { useServices } from '@feoe/bifrost-chat';

function QueueStats() {
  const { offlineMessageQueue: queueService } = useServices();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!queueService) return;

    queueService.getStats().then(setStats);
  }, [queueService]);

  if (!stats) return null;

  return (
    <div>
      <p>总消息数: {stats.total}</p>
      <p>最旧消息: {new Date(stats.oldestMessageAt).toLocaleString()}</p>
      <p>最新消息: {new Date(stats.newestMessageAt).toLocaleString()}</p>
    </div>
  );
}
```

---

## 故障排查

### 消息未保存到离线队列

**可能原因：**

1. 离线队列未启用
2. 队列已满（超过 `maxQueueSize`）
3. IndexedDB 初始化失败

**解决方案：**

```tsx
import { useServices } from '@feoe/bifrost-chat';

const { offlineMessageQueue: queueService } = useServices();

if (!queueService) {
  return <div>离线队列未启用</div>;
}
```

### 消息重试失败

**可能原因：**

1. 网络仍未连接
2. 消息服务实现有问题
3. 达到最大重试次数

**解决方案：**

```tsx
// 检查网络状态
import { useNetwork } from '@feoe/bifrost-chat';

const networkStatus = useNetwork().status;

if (networkStatus !== 'connected') {
  return <div>网络未连接</div>;
}

// 检查重试次数
const messages = await queueService.getAll();
const failedMessages = messages.filter(
  (m) => m.retryCount >= m.maxRetries
);

console.log('达到最大重试次数的消息:', failedMessages);
```

### IndexedDB 配额超限

**可能原因：**

存储的消息过多，超过浏览器配额。

**解决方案：**

```tsx
// 定期清理过期消息
useEffect(() => {
  const cleanupInterval = setInterval(async () => {
    if (queueService) {
      const cleaned = await queueService.cleanup();
      console.log(`清理了 ${cleaned} 条过期消息`);
    }
  }, 60 * 60 * 1000); // 每小时清理一次

  return () => clearInterval(cleanupInterval);
}, [queueService]);
```

---

## 最佳实践

1. **合理设置队列大小**：根据应用场景设置 `maxQueueSize`，避免占用过多存储空间
2. **选择合适的重试策略**：指数退避适合大多数场景，固定延迟适合测试
3. **定期清理过期消息**：设置合理的 `messageExpiration`，避免消息堆积
4. **监控队列状态**：使用 `subscribe` 监听队列变化，及时发现异常
5. **提供用户反馈**：基于 `queueService.subscribe` 自定义展示队列状态

---

## 浏览器兼容性

| 浏览器 | 最低版本 | IndexedDB 支持 |
|--------|----------|----------------|
| Chrome | 23+ | ✅ |
| Firefox | 10+ | ✅ |
| Safari | 7+ | ✅ |
| Edge | 12+ | ✅ |
| Opera | 15+ | ✅ |
| IE | 10+ | ✅ |

**注意：** 不支持 IndexedDB 的浏览器会自动降级到 localStorage（容量限制更小）。

---

## 相关文档

- [离线消息队列架构设计](./offline-message-queue-design.md)
- [消息接口定义](../src/interfaces/message.interface.ts)
- [错误处理](../src/errors/sdk.errors.ts)
