import { useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce.hook';
import { useScrollEndDebounce } from '@/hooks/use-scroll-end-debounce.hook';
import type { StandardMessage } from '@/interfaces/message.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

/**
 * 标记已读参数接口
 */
export interface MarkAsReadParams {
  /** 会话 ID */
  conversationId: string;
  /** 未读消息 ID 列表 */
  messageIds: string[];
}

export interface UseUnreadMessagesCollectorOptions {
  /** 防抖延迟（毫秒），默认 1000ms */
  debounceDelay?: number;
  /** 滚动结束检测延迟（毫秒），默认 150ms */
  scrollEndDelay?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 标记已读回调（返回 Promise 以支持异步处理） */
  onMarkAsRead: (params: MarkAsReadParams) => Promise<void> | void;
  /** 消息列表（用于获取消息状态） */
  messages: StandardMessage[];
  /** 可见消息 ID 列表 */
  visibleMessageIds: string[];
  /** 会话 ID */
  conversationId: string;
}

/**
 * useUnreadMessagesCollector：收集可见的未读消息，并在滚动结束后触发标记
 *
 * @description
 * 监听消息列表的滚动和可见性变化，收集状态非 Read 的可见消息 ID。
 * 使用 Set 数据结构存储已收集的消息 ID（避免重复）。
 * 当滚动结束后，使用防抖延迟调用 onMarkAsRead 回调。
 *
 * @param scrollRef - 滚动容器的引用
 * @param options - 配置选项
 *
 * @example
 * ```tsx
 * const markAsRead = useMarkAsRead<MarkAsReadParams>();
 *
 * useUnreadMessagesCollector(scrollRef, {
 *   messages,
 *   visibleMessageIds: visibleIds,
 *   conversationId: 'conv-123',
 *   enabled: true,
 *   debounceDelay: 1000,
 *   onMarkAsRead: (params) => {
 *     if (params.messageIds.length > 0) {
 *       markAsRead.mutate(params);
 *     }
 *   },
 * });
 * ```
 */
export function useUnreadMessagesCollector(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  options: UseUnreadMessagesCollectorOptions,
): void {
  const {
    debounceDelay = 1000,
    scrollEndDelay = 150,
    enabled = true,
    onMarkAsRead,
    messages,
    visibleMessageIds,
    conversationId,
  } = options;

  // 存储已收集的未读消息 ID
  const collectedUnreadIdsRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef(false);

  // 使用 ref 存储最新的 visibleMessageIds，避免在 useCallback 依赖数组中包含它
  // 这样可以防止因 visibleMessageIds 变化导致的无限循环
  const visibleMessageIdsRef = useRef<string[]>([]);
  useEffect(() => {
    visibleMessageIdsRef.current = visibleMessageIds;
  }, [visibleMessageIds]);

  // 检测滚动是否结束
  const isScrollEnd = useScrollEndDebounce(scrollRef, {
    delay: scrollEndDelay,
    enabled,
  });

  // 收集可见的未读消息 ID
  const collectUnreadMessages = useCallback(() => {
    if (!enabled || !messages || messages.length === 0) {
      return [];
    }

    const unreadIds: string[] = [];
    const currentVisibleIds = visibleMessageIdsRef.current;

    messages.forEach((message) => {
      // 1. 只收集可见的且状态为非 Read 的消息
      // 2. 只收集服务器推送到客户端的消息 ID
      // 3. 只收集用户发送过来的上行消息（用户/客户发出）ID;
      const messageId = message.id;

      if (
        messageId &&
        currentVisibleIds.includes(messageId) &&
        message.status !== MessageStatusEnum.Read &&
        message.direction === MessageDirectionEnum.Incoming &&
        !collectedUnreadIdsRef.current.has(messageId)
      ) {
        unreadIds.push(messageId);
        collectedUnreadIdsRef.current.add(messageId);
      }
    });

    return unreadIds;
  }, [enabled, messages]); // 移除 visibleMessageIds 依赖，避免无限循环

  // 防抖处理：在滚动结束后延迟调用标记
  // 只在有实际收集的 ID 且滚动结束时才进行防抖
  const collectedIds = Array.from(collectedUnreadIdsRef.current);
  const debouncedCollectedIds = useDebounce(
    isScrollEnd && collectedIds.length > 0 ? collectedIds : [],
    debounceDelay,
  );

  // 当防抖后的数据变化时，触发标记
  useEffect(() => {
    if (
      !enabled ||
      isProcessingRef.current ||
      debouncedCollectedIds.length === 0
    ) {
      return;
    }

    isProcessingRef.current = true;

    // 调用标记回调并等待完成
    const markAsReadPromise = Promise.resolve(
      onMarkAsRead({
        conversationId,
        messageIds: debouncedCollectedIds,
      }),
    );

    // 等待标记完成后清空已收集的 ID
    markAsReadPromise
      .then(() => {
        // 仅在成功时清空已收集的 ID
        collectedUnreadIdsRef.current.clear();
      })
      .catch((error) => {
        // 标记失败时保留 ID，以便下次重试
        console.error('Failed to mark messages as read:', error);
      })
      .finally(() => {
        isProcessingRef.current = false;
      });

    // 注意：不返回清理函数，因为 Promise 会自行处理
  }, [debouncedCollectedIds, enabled, conversationId, onMarkAsRead]);

  // 实时收集未读消息（不等待滚动结束）
  useEffect(() => {
    if (!enabled || !isScrollEnd) {
      return;
    }

    collectUnreadMessages();
  }, [enabled, isScrollEnd, collectUnreadMessages]);
}
