# 消息聊天场景虚拟滚动方案研究

## 研究目标

针对 Bifrost-Chat 消息列表场景，评估并选择最适合的虚拟滚动方案。

## 消息聊天场景的特殊需求

### 1. 动态高度
- 文本消息：根据内容长度动态变化
- 图片消息：需要考虑宽高比和加载状态
- 视频/文件消息：固定高度但可能有展开/收起状态
- 系统消息：居中显示，高度较小

### 2. 反向无限滚动
- 新消息在底部，需要向上滚动加载历史消息
- 加载历史消息时需要保持当前滚动位置

### 3. 自动滚动行为
- 新消息到达时自动滚动到底部
- 用户向上滚动查看历史时不自动滚动
- 用户在底部附近时才自动滚动

### 4. 性能要求
- 支持 1000+ 条消息不卡顿
- 滚动帧率稳定在 60fps
- 内存占用优化

## 主流虚拟滚动方案对比

### 1. @tanstack/react-virtual ⭐ 推荐

**优点：**
- ✅ 专为 React 设计，API 简洁直观
- ✅ 完美支持动态高度（使用 `measureElement` API）
- ✅ 轻量级，bundle 体积小（~3KB）
- ✅ 与 TanStack 生态系统无缝集成（React Query）
- ✅ 支持反向滚动（`scrollDirection: 'both'`）
- ✅ TypeScript 支持完善
- ✅ 活跃维护，文档完善
- ✅ 无外部依赖，纯 React 实现

**缺点：**
- ⚠️ 需要手动处理滚动位置同步
- ⚠️ 需要自己实现无限滚动逻辑

**适用场景：** 需要高度定制化的聊天应用

**核心 API：**
```typescript
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 50, // 初始估算高度
  measureElement: (element) => {
    // 动态测量实际高度
    return element?.getBoundingClientRect().height || 50;
  },
  overscan: 5, // 预渲染上下各 5 个元素
});
```

---

### 2. react-virtuoso

**优点：**
- ✅ 专为列表和网格设计，开箱即用
- ✅ 内置无限滚动支持（`endReached`、`startReached`）
- ✅ 自动处理动态高度
- ✅ 支持反向滚动
- ✅ 内置自动滚动到底部功能（`followOutput`）
- ✅ 性能优秀，社区活跃

**缺点：**
- ⚠️ bundle 体积较大（~20KB）
- ⚠️ 定制化程度相对较低
- ⚠️ 某些高级功能需要使用 `VirtuosoGrid` 组件

**适用场景：** 快速实现，不需要高度定制

**核心 API：**
```typescript
<Virtuoso
  data={messages}
  initialTopMostItemIndex={messages.length - 1}
  itemContent={(index, message) => <MessageBubble message={message} />}
  startReached={() => fetchPreviousPage()}
  followOutput="auto"
  overscan={200}
/>
```

---

### 3. react-window

**优点：**
- ✅ 轻量级（~5KB）
- ✅ 性能极佳，React 生态经典方案
- ✅ 成熟稳定，广泛使用

**缺点：**
- ❌ 不支持动态高度（需要使用 `VariableSizeList`，但实现复杂）
- ❌ API 较为底层，需要更多样板代码
- ❌ 不支持反向滚动
- ❌ 维护不活跃（已归档）

**适用场景：** 固定高度列表，不推荐用于聊天场景

---

### 4. react-virtualized

**优点：**
- ✅ 功能全面，支持多种场景
- ✅ 成熟稳定

**缺点：**
- ❌ bundle 体积大（~130KB）
- ❌ API 复杂，学习曲线陡峭
- ❌ 维护不活跃
- ❌ 性能不如新方案

**适用场景：** 复杂表格/网格，不推荐用于聊天场景

---

## 方案评分对比

| 方案 | 动态高度 | 反向滚动 | 无限滚动 | Bundle 大小 | API 简洁性 | 维护状态 | 总分 |
|------|---------|---------|---------|------------|-----------|---------|------|
| @tanstack/react-virtual | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (3KB) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **23/25** |
| react-virtuoso | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (20KB) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **23/25** |
| react-window | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ (5KB) | ⭐⭐⭐ | ⭐⭐ | **16/25** |
| react-virtualized | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ (130KB) | ⭐⭐ | ⭐⭐ | **14/25** |

## 最终推荐：@tanstack/react-virtual

### 选择理由

1. **完美契合项目架构**
   - 项目已使用 `@tanstack/react-query`，技术栈统一
   - 可以与 React Query 的无限滚动无缝集成

2. **灵活性和可控性**
   - 提供底层 API，可以实现精确的滚动控制
   - 可以自定义消息高度估算策略
   - 可以实现智能的自动滚动逻辑

3. **性能优化**
   - 最小的 bundle 体积
   - 高效的虚拟化算法
   - 支持动态高度测量和缓存

4. **开发体验**
   - TypeScript 支持完善
   - API 设计直观
   - 文档清晰，示例丰富

### 实现方案概览

```typescript
// MessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function MessageList({ messages }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 虚拟化配置
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // 根据消息类型估算高度
      const message = messages[index];
      return estimateMessageHeight(message);
    },
    measureElement: (element) => {
      // 动态测量实际高度
      return element?.getBoundingClientRect().height || 50;
    },
    overscan: 5, // 预渲染上下各 5 个元素
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} style={{ overflowY: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
            data-index={virtualItem.index}
          >
            <MessageRendererFactory
              message={messages[virtualItem.index]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 消息高度估算策略

```typescript
function estimateMessageHeight(message: StandardMessage): number {
  switch (message.type) {
    case MessageTypeEnum.Text:
      // 根据文本长度估算
      const textLength = (message.content as StringMessage).text.length;
      return Math.min(Math.max(40, textLength * 0.5), 200);

    case MessageTypeEnum.Image:
      return 200; // 图片默认高度

    case MessageTypeEnum.Video:
      return 180; // 视频默认高度

    case MessageTypeEnum.Audio:
      return 60; // 语音消息固定高度

    case MessageTypeEnum.File:
      return 80; // 文件消息固定高度

    case MessageTypeEnum.Other:
      return 30; // 系统消息固定高度

    default:
      return 60; // 默认高度
  }
}
```

### 无限滚动集成

```typescript
// InfiniteMessageList.tsx
const virtualizer = useVirtualizer({
  // ... 其他配置
});

// 监听滚动到顶部，触发加载更多
useEffect(() => {
  const [virtualItem] = virtualizer.getVirtualItems();
  if (!virtualItem) return;

  // 当第一个可见元素索引小于 3 时，加载更多历史消息
  if (virtualItem.index < 3 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage]);
```

### 自动滚动逻辑

```typescript
// 检测用户是否在底部附近
const isNearBottom = useNearBottom(scrollRef, { threshold: 100 });

// 新消息到达时自动滚动
useEffect(() => {
  if (isNearBottom && hasNewMessages) {
    virtualizer.scrollToIndex(messages.length - 1, {
      align: 'end',
      behavior: 'smooth',
    });
  }
}, [hasNewMessages, isNearBottom]);
```

## 参考资源

- [@tanstack/react-virtual 官方文档](https://tanstack.com/virtual/latest)
- [react-virtuoso 官方文档](https://virtuoso.dev/)
- [WhatsApp Web 消息列表实现分析](https://engineering.fb.com/2021/05/06/web/web-performance-whatsapp-web/)
- [iMessage 虚拟滚动最佳实践](https://developer.apple.com/documentation/uikit/uicollectionview)
