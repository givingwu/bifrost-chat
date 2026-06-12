import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMarkAsRead } from '@/hooks/use-mark-as-read.hook';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';
import {
  estimateMessageHeight,
  getCachedMessageHeight,
  getMessageHeightCacheKey,
  MESSAGE_LIST_ITEM_GAP,
  setCachedMessageHeight,
} from '@/utils/message-height.util';
import { MessageRendererFactory } from './MessageRendererFactory';

const DATE_SEPARATOR_ESTIMATED_HEIGHT = 36;

type MessageRenderItem =
  | {
      type: 'date-separator';
      key: string;
      label: string;
    }
  | {
      type: 'message';
      key: string;
      message: StandardMessage;
    };

export interface MessageListProps {
  /** 消息流 */
  messages: StandardMessage[];
  /** 虚拟滚动容器的引用（用于外部访问） */
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** 是否启用虚拟滚动，默认启用 */
  enableVirtualization?: boolean;
  /** 是否启用自动标记已读，默认 false */
  enableAutoMarkAsRead?: boolean;
  /** 标记已读的防抖延迟（毫秒），默认 1000ms */
  markAsReadDebounceDelay?: number;
  /** 会话 ID（用于 markAsRead 调用） */
  conversationId?: string;
  /** 是否启用反向渲染（column-reverse） */
  reverse?: boolean;
}

/**
 * 将日期和时间数字补齐为两位字符串。
 *
 * @param value 日期或时间数值
 * @returns 两位字符串
 */
function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * 获取消息时间戳对应的本地自然日 key。
 *
 * @param timestamp 消息时间戳
 * @returns `YYYY-MM-DD` 日期 key；无效时间返回 undefined
 */
function getLocalDateKey(timestamp: number): string | undefined {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

/**
 * 格式化消息日期分隔符文本。
 *
 * @param timestamp 每天第一条消息的时间戳
 * @returns `YYYY-MM-DD HH:mm:ss` 格式文本
 */
function formatMessageDateSeparator(timestamp: number): string | undefined {
  const dateKey = getLocalDateKey(timestamp);
  if (!dateKey) {
    return undefined;
  }

  const date = new Date(timestamp);

  return `${dateKey} ${[
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join(':')}`;
}

/**
 * 构建带日期分隔符的消息渲染项。
 *
 * @description
 * 输入消息按当前展示顺序处理；当自然日变化时，在该天第一条消息前插入
 * 一个日期分隔符。无效时间戳不生成分隔符，但仍渲染消息本身。
 *
 * @param messages 标准消息列表
 * @returns 消息与日期分隔符混合的渲染项
 */
function buildMessageRenderItems(
  messages: StandardMessage[],
): MessageRenderItem[] {
  const items: MessageRenderItem[] = [];
  let previousDateKey: string | undefined;

  messages.forEach((message, index) => {
    const dateKey = getLocalDateKey(message.timestamp);
    const label = formatMessageDateSeparator(message.timestamp);
    const messageKey = message.id || message.tempId || `index-${index}`;

    if (dateKey && dateKey !== previousDateKey && label) {
      items.push({
        type: 'date-separator',
        key: `date-${dateKey}-${messageKey}`,
        label,
      });
    }

    items.push({
      type: 'message',
      key: `message-${messageKey}`,
      message,
    });

    previousDateKey = dateKey ?? previousDateKey;
  });

  return items;
}

export interface MessageDateSeparatorProps {
  /** 日期分隔符展示文案 */
  label: string;
}

/**
 * MessageDateSeparator：消息流中的自然日分隔符。
 *
 * @param props 日期分隔符属性
 * @returns 居中显示的日期分隔符
 */
function MessageDateSeparator({ label }: MessageDateSeparatorProps) {
  return (
    <div
      data-component="message-date-separator"
      className="flex w-full justify-center py-2"
    >
      <time
        dateTime={label.replace(' ', 'T')}
        className="inline-flex whitespace-nowrap rounded-full bg-muted px-3 py-1 text-[11px] leading-none text-text-muted shadow-sm"
      >
        {label}
      </time>
    </div>
  );
}

/**
 * MessageList：消息列表组件
 *
 * @description
 * 渲染消息列表，使用 MessageRendererFactory 根据消息类型渲染不同的消息组件。
 * 使用 @tanstack/react-virtual 实现虚拟滚动，大幅提升大量消息场景下的性能。
 *
 * @features
 * - 虚拟滚动：只渲染可见区域的消息，支持 1000+ 条消息不卡顿
 * - 动态高度：自动测量不同类型消息的实际高度
 * - 性能优化：使用稳定 key 缓存已测量的消息高度
 * - 向后兼容：可通过 `enableVirtualization` 禁用虚拟滚动
 *
 * @example
 * ```tsx
 * <MessageList messages={messages} />
 * ```
 *
 * @example 禁用虚拟滚动
 * ```tsx
 * <MessageList messages={messages} enableVirtualization={false} />
 * ```
 */
export const MessageList = ({
  messages,
  scrollRef: externalScrollRef,
  enableVirtualization = true,
  enableAutoMarkAsRead = false,
  markAsReadDebounceDelay = 1000,
  conversationId,
  reverse = false,
}: MessageListProps) => {
  const { t } = useTranslation();
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;
  const { mutate: markAsReadMutate } = useMarkAsRead();
  const readMessageIdsRef = useRef<Set<string>>(new Set());
  const markAsReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMarkAsReadTimer = useCallback(() => {
    if (!markAsReadTimerRef.current) return;
    clearTimeout(markAsReadTimerRef.current);

    markAsReadTimerRef.current = null;
  }, []);

  const flushReadMessageIds = useCallback(
    (targetConversationId?: string) => {
      const currentConversationId = targetConversationId ?? conversationId;
      if (!enableAutoMarkAsRead || !currentConversationId) return;
      if (readMessageIdsRef.current.size === 0) return;

      const messageIds = Array.from(readMessageIdsRef.current);
      readMessageIdsRef.current.clear();

      markAsReadMutate({
        conversationId: currentConversationId,
        messageIds,
      });
    },
    [conversationId, enableAutoMarkAsRead, markAsReadMutate],
  );

  const scheduleMarkAsRead = useCallback(() => {
    if (!enableAutoMarkAsRead || !conversationId) return;

    clearMarkAsReadTimer();
    markAsReadTimerRef.current = setTimeout(() => {
      flushReadMessageIds();
    }, markAsReadDebounceDelay);
  }, [
    clearMarkAsReadTimer,
    conversationId,
    enableAutoMarkAsRead,
    flushReadMessageIds,
    markAsReadDebounceDelay,
  ]);

  const handleMessageInViewport = useCallback(
    (message: StandardMessage) => {
      if (!enableAutoMarkAsRead || !conversationId) return;
      if (message.direction !== MessageDirectionEnum.Incoming) return;
      if (message.status === MessageStatusEnum.Read) return;

      const messageId = message.id || message.tempId;
      if (!messageId) return;

      readMessageIdsRef.current.add(messageId);
      scheduleMarkAsRead();
    },
    [conversationId, enableAutoMarkAsRead, scheduleMarkAsRead],
  );

  // 始终调用 useVirtualizer hook（避免条件性调用 hook）
  // 当禁用虚拟滚动时，count 设置为 0
  const shouldUseVirtualization =
    enableVirtualization && !reverse && messages.length >= 20;
  const chronologicalRenderItems = useMemo(
    () => buildMessageRenderItems(messages),
    [messages],
  );
  const displayItems = useMemo(
    () =>
      reverse
        ? [...chronologicalRenderItems].reverse()
        : chronologicalRenderItems,
    [chronologicalRenderItems, reverse],
  );

  const renderMessageItem = useCallback(
    (message: StandardMessage, itemKey: string) => {
      const messageId = message.id || message.tempId;

      return (
        <div key={itemKey} data-message-id={messageId}>
          <MessageRendererFactory
            message={message}
            conversationId={conversationId}
            onInViewport={handleMessageInViewport}
          />
        </div>
      );
    },
    [conversationId, handleMessageInViewport],
  );

  const renderItem = useCallback(
    (item: MessageRenderItem) => {
      if (item.type === 'date-separator') {
        return <MessageDateSeparator key={item.key} label={item.label} />;
      }

      return renderMessageItem(item.message, item.key);
    },
    [renderMessageItem],
  );

  const virtualizer = useVirtualizer({
    count: shouldUseVirtualization ? displayItems.length : 0,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => {
      const item = displayItems[index];
      if (!item) return index;
      if (item.type === 'date-separator') return item.key;

      return getMessageHeightCacheKey(item.message) ?? item.key;
    },
    estimateSize: (index) => {
      const item = displayItems[index];
      if (!item || item.type === 'date-separator') {
        return DATE_SEPARATOR_ESTIMATED_HEIGHT;
      }

      return (
        getCachedMessageHeight(item.message) ??
        estimateMessageHeight(item.message)
      );
    },
    measureElement: (element) => {
      if (!element) return 0;

      // 动态测量实际高度
      const height = element.getBoundingClientRect().height;

      // 缓存已测量的高度
      const dataIndex = Number(element.getAttribute('data-index'));
      const item = displayItems[dataIndex];
      if (item?.type === 'message') {
        setCachedMessageHeight(item.message, height);
      }

      return height;
    },
    gap: MESSAGE_LIST_ITEM_GAP,
    overscan: 5, // 预渲染上下各 5 个元素
  });

  useEffect(() => {
    if (enableAutoMarkAsRead && conversationId) return;
    readMessageIdsRef.current.clear();
    clearMarkAsReadTimer();
  }, [clearMarkAsReadTimer, conversationId, enableAutoMarkAsRead]);

  useEffect(() => {
    return () => {
      clearMarkAsReadTimer();
      flushReadMessageIds(conversationId);
      readMessageIdsRef.current.clear();
    };
  }, [clearMarkAsReadTimer, conversationId, flushReadMessageIds]);

  // ==================== markAsRead：可见消息追踪 ====================
  // 获取虚拟滚动的可见项
  const virtualItems = shouldUseVirtualization
    ? virtualizer.getVirtualItems()
    : [];

  // 如果禁用虚拟滚动或消息数量较少，使用传统渲染方式
  if (!shouldUseVirtualization) {
    return (
      <div
        ref={scrollRef}
        data-component="message-list"
        className={`flex h-full ${
          reverse ? 'flex-col-reverse' : 'flex-col'
        } gap-2 overflow-y-auto bg-card/60 p-4 shadow-soft`}
      >
        {displayItems.length ? (
          displayItems.map((item) => renderItem(item))
        ) : (
          <div className="flex h-full flex-1 items-center justify-center">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {t('message.empty')}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 使用虚拟滚动渲染（virtualItems 已在前面声明）
  return (
    <div
      ref={scrollRef}
      data-component="message-list"
      className="h-full overflow-y-auto bg-card/60 p-4 shadow-soft"
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-1 items-center justify-center">
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {t('message.empty')}
          </span>
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = displayItems[virtualItem.index];
            const messageId =
              item?.type === 'message'
                ? item.message.id || item.message.tempId
                : undefined;

            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                data-message-id={messageId}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item ? renderItem(item) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
