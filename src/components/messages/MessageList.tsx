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
  const { mutate: markAsReadMutate } = useMarkAsRead<{
    conversationId: string;
    messageIds: string[];
  }>();
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

  // 开发模式下验证 props
  if (process.env.NODE_ENV === 'development') {
    if (enableAutoMarkAsRead && !conversationId) {
      console.warn(
        '[MessageList] enableAutoMarkAsRead is true but conversationId is missing. ' +
          'Mark as read functionality will be disabled.',
      );
    }
  }

  // 始终调用 useVirtualizer hook（避免条件性调用 hook）
  // 当禁用虚拟滚动时，count 设置为 0
  const shouldUseVirtualization =
    enableVirtualization && !reverse && messages.length >= 20;
  const displayMessages = useMemo(
    () => (reverse ? [...messages].reverse() : messages),
    [messages, reverse],
  );

  const virtualizer = useVirtualizer({
    count: shouldUseVirtualization ? messages.length : 0,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => {
      const message = messages[index];
      return getMessageHeightCacheKey(message) ?? index;
    },
    estimateSize: (index) => {
      const message = messages[index];
      return getCachedMessageHeight(message) ?? estimateMessageHeight(message);
    },
    measureElement: (element) => {
      if (!element) return 0;

      // 动态测量实际高度
      const height = element.getBoundingClientRect().height;

      // 缓存已测量的高度
      const dataIndex = Number(element.getAttribute('data-index'));
      if (dataIndex >= 0 && dataIndex < messages.length) {
        setCachedMessageHeight(messages[dataIndex], height);
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
        {displayMessages.length ? (
          displayMessages.map((message) => {
            const messageId = message.id || message.tempId;
            return (
              <div key={messageId} data-message-id={messageId}>
                <MessageRendererFactory
                  message={message}
                  onInViewport={handleMessageInViewport}
                />
              </div>
            );
          })
        ) : (
          <div className="flex h-full flex-1 items-center justify-center">
            <span className="text-sm text-text-muted">
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
          <span className="text-sm text-text-muted">{t('message.empty')}</span>
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
            const message = messages[virtualItem.index];
            const messageId = message?.id || message?.tempId;

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
                <MessageRendererFactory
                  message={message}
                  onInViewport={handleMessageInViewport}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
