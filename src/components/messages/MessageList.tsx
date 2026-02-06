import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { StandardMessage } from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';
import {
  estimateMessageHeight,
  setCachedMessageHeight,
} from '@/utils/message-height.util';
import { MessageRendererFactory } from './MessageRendererFactory';

export interface MessageListProps {
  /** 消息流 */
  messages: StandardMessage[];
  /** 虚拟滚动容器的引用（用于外部访问） */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** 是否启用虚拟滚动，默认启用 */
  enableVirtualization?: boolean;
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
 * - 性能优化：使用 WeakMap 缓存已测量的消息高度
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
}: MessageListProps) => {
  const { t } = useTranslation();
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef || internalScrollRef;

  // 始终调用 useVirtualizer hook（避免条件性调用 hook）
  // 当禁用虚拟滚动时，count 设置为 0
  const shouldUseVirtualization = enableVirtualization && messages.length >= 20;

  const virtualizer = useVirtualizer({
    count: shouldUseVirtualization ? messages.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const message = messages[index];
      return estimateMessageHeight(message);
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
    overscan: 5, // 预渲染上下各 5 个元素
  });

  // 如果禁用虚拟滚动或消息数量较少，使用传统渲染方式
  if (!shouldUseVirtualization) {
    return (
      <div
        ref={scrollRef}
        data-component="message-list"
        className="flex h-full flex-col gap-2 overflow-y-auto rounded-2xl bg-card/60 p-4 shadow-soft"
      >
        {messages.length ? (
          messages.map((message) => (
            <MessageRendererFactory
              key={message.id ?? message.tempId}
              message={message}
            />
          ))
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

  // 使用虚拟滚动渲染
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={scrollRef}
      data-component="message-list"
      className="h-full overflow-y-auto rounded-2xl bg-card/60 p-4 shadow-soft"
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
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageRendererFactory message={messages[virtualItem.index]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
