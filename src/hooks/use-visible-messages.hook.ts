import type { VirtualItem } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';
import type { StandardMessage } from '@/interfaces/message.interface';

export interface UseVisibleMessagesOptions {
  /** 可见性阈值（0-1），默认 0.1（元素 10% 可见时认为可见） */
  threshold?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 虚拟滚动的可见项（如果使用虚拟滚动） */
  virtualItems?: VirtualItem[];
  /** 消息列表（用于虚拟滚动模式） */
  messages?: StandardMessage[];
}

/**
 * useVisibleMessages：追踪消息列表中当前可见的消息
 *
 * @description
 * 监听消息列表的可见性变化，返回当前可见的消息 ID 列表。
 * 支持两种模式：
 * 1. 虚拟滚动模式：通过 virtualItems 参数获取可见项
 * 2. 传统渲染模式：使用 Intersection Observer API 检测可见性
 *
 * @param scrollRef - 滚动容器的引用
 * @param messages - 消息列表
 * @param options - 配置选项
 * @returns 可见的消息 ID 列表
 *
 * @example
 * ```tsx
 * // 虚拟滚动模式
 * const virtualItems = virtualizer.getVirtualItems();
 * const visibleIds = useVisibleMessages(scrollRef, messages, {
 *   virtualItems,
 *   messages,
 * });
 *
 * // 传统渲染模式
 * const visibleIds = useVisibleMessages(scrollRef, messages, {
 *   threshold: 0.1,
 * });
 * ```
 */
export function useVisibleMessages(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  messages: StandardMessage[],
  options: UseVisibleMessagesOptions = {},
): string[] {
  const {
    threshold = 0.1,
    enabled = true,
    virtualItems,
    messages: msgsForVirtual,
  } = options;
  const [visibleMessageIds, setVisibleMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRefsRef = useRef<Map<string, HTMLElement>>(new Map());
  // 使用 ref 存储当前可见 ID，避免在 Intersection Observer 回调中依赖状态
  const visibleIdsRef = useRef<Set<string>>(new Set());

  // 虚拟滚动模式
  const isVirtualMode = !!virtualItems && !!msgsForVirtual;

  useEffect(() => {
    if (!enabled || !messages || messages.length === 0) {
      setVisibleMessageIds(new Set());
      return;
    }

    // 虚拟滚动模式：从 virtualItems 获取可见消息
    if (isVirtualMode) {
      const visibleIds = new Set(
        virtualItems
          .map((item) => {
            const message = msgsForVirtual[item.index];
            return message?.id || message?.tempId;
          })
          .filter((id): id is string => !!id),
      );
      // 同步更新 ref 和状态
      visibleIdsRef.current = visibleIds;
      setVisibleMessageIds(visibleIds);
      return;
    }

    // 传统渲染模式：使用 Intersection Observer
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建新的 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // 使用 ref 存储当前可见 ID，避免依赖状态导致无限循环
        const newVisibleIds = new Set(visibleIdsRef.current);

        entries.forEach((entry) => {
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) return;

          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            newVisibleIds.add(messageId);
          } else {
            newVisibleIds.delete(messageId);
          }
        });

        // 同步更新 ref 和状态
        visibleIdsRef.current = newVisibleIds;
        setVisibleMessageIds(newVisibleIds);
      },
      {
        root: element,
        threshold,
      },
    );

    observerRef.current = observer;

    // 获取所有消息项元素并开始观察
    const messageElements = element.querySelectorAll('[data-message-id]');
    const newElementRefs = new Map<string, HTMLElement>();

    messageElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const messageId = el.getAttribute('data-message-id');
        if (messageId) {
          newElementRefs.set(messageId, el);
          observer.observe(el);
        }
      }
    });

    elementRefsRef.current = newElementRefs;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [
    scrollRef,
    messages,
    threshold,
    enabled,
    isVirtualMode,
    virtualItems,
    msgsForVirtual,
  ]);

  return Array.from(visibleMessageIds);
}
