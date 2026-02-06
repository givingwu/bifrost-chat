import { useEffect, useState } from 'react';

/**
 * useDebounce：防抖 Hook
 *
 * @description
 * 延迟更新值，直到用户停止输入指定的时间后才会更新。
 * 适用于搜索输入框、自动保存等场景。
 *
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒），默认 500ms
 * @returns 防抖后的值
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearchQuery = useDebounce(searchQuery, 500);
 *
 * useEffect(() => {
 *   // 只有在 debouncedSearchQuery 变化后才执行搜索
 *   if (debouncedSearchQuery) {
 *     performSearch(debouncedSearchQuery);
 *   }
 * }, [debouncedSearchQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清除定时器（在组件卸载或 value/delay 变化时）
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
