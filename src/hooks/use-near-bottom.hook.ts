import { useEffect, useRef, useState } from 'react';

export interface UseNearBottomOptions {
  /** 距离底部的阈值（像素），默认 100px */
  threshold?: number;
  /** 是否启用检测，默认 true */
  enabled?: boolean;
}

/**
 * useNearBottom：检测滚动容器是否在底部附近
 *
 * @description
 * 检测滚动容器是否在底部附近，用于实现智能自动滚动功能。
 * 当用户在底部附近时，新消息到达可以自动滚动到底部；
 * 当用户向上滚动查看历史消息时，不自动滚动。
 *
 * @param scrollRef - 滚动容器的引用
 * @param options - 配置选项
 * @returns 是否在底部附近
 *
 * @example
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null);
 * const isNearBottom = useNearBottom(scrollRef, { threshold: 100 });
 *
 * useEffect(() => {
 *   if (isNearBottom && hasNewMessages) {
 *     scrollToBottom();
 *   }
 * }, [isNearBottom, hasNewMessages]);
 * ```
 */
export function useNearBottom(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  options: UseNearBottomOptions = {},
): boolean {
  const { threshold = 100, enabled = true } = options;
  const [isNearBottom, setIsNearBottom] = useState(true);
  const previousScrollHeight = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      setIsNearBottom(false);
      return;
    }

    // 初始化：检查是否在底部附近
    const checkNearBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom <= threshold;
      setIsNearBottom(nearBottom);
      previousScrollHeight.current = scrollHeight;
    };

    // 初始检查
    checkNearBottom();

    // 监听滚动事件
    const handleScroll = () => {
      checkNearBottom();
    };

    // 监听内容变化（如新消息到达）
    const observer = new MutationObserver(() => {
      const { scrollHeight } = element;
      // 如果内容高度增加，且之前在底部附近，则认为仍在底部附近
      if (scrollHeight > previousScrollHeight.current && isNearBottom) {
        setIsNearBottom(true);
        previousScrollHeight.current = scrollHeight;
      }
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
    });

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [scrollRef, threshold, enabled, isNearBottom]);

  return isNearBottom;
}
