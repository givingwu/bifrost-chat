import { useEffect, useRef, useState } from 'react';

export interface UseScrollEndDebounceOptions {
  /** 滚动结束检测延迟（毫秒），默认 150ms */
  delay?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
}

/**
 * useScrollEndDebounce：检测滚动容器是否停止滚动
 *
 * @description
 * 监听滚动容器的滚动事件，检测滚动是否停止。
 * 使用定时器机制，每次滚动时重置定时器，定时器到期后认为滚动结束。
 * 适用于需要在滚动结束后执行某些操作的场景，如加载更多数据、标记已读等。
 *
 * @param scrollRef - 滚动容器的引用
 * @param options - 配置选项
 * @returns 滚动是否已结束
 *
 * @example
 * ```tsx
 * const scrollRef = useRef<HTMLDivElement>(null);
 * const isScrollEnd = useScrollEndDebounce(scrollRef, { delay: 150 });
 *
 * useEffect(() => {
 *   if (isScrollEnd) {
 *     // 滚动结束后的操作
 *     loadMoreData();
 *   }
 * }, [isScrollEnd]);
 * ```
 */
export function useScrollEndDebounce(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  options: UseScrollEndDebounceOptions = {},
): boolean {
  const { delay = 150, enabled = true } = options;
  const [isScrollEnd, setIsScrollEnd] = useState(true);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      setIsScrollEnd(true);
      return;
    }

    // 清除定时器
    const clearScrollTimer = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };

    // 标记滚动开始
    const handleScrollStart = () => {
      setIsScrollEnd(false);
      clearScrollTimer();
    };

    // 标记滚动结束
    const handleScrollEnd = () => {
      scrollTimerRef.current = setTimeout(() => {
        setIsScrollEnd(true);
      }, delay);
    };

    // 滚动事件处理
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      handleScrollStart();

      // 清除之前的定时器
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // 设置新的定时器
      scrollTimeout = setTimeout(() => {
        handleScrollEnd();
      }, delay);
    };

    // 监听滚动事件
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      clearScrollTimer();

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollRef, delay, enabled]);

  return isScrollEnd;
}
