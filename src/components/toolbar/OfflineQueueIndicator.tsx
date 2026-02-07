import { memo, useEffect, useState } from 'react';
import { useOfflineMessage } from '@/providers/offline-message.provider';
import { cn } from '@/utils/class.util';

/**
 * 离线队列指示器 Props
 */
export interface OfflineQueueIndicatorProps {
  /** 队列中的消息数量 */
  count: number;
  /** 是否正在同步 */
  isSyncing?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击回调（例如打开队列详情） */
  onClick?: () => void;
  /** 是否显示文本标签 */
  showLabel?: boolean;
  /** 自定义文本标签 */
  label?: string;
}

/**
 * 基础容器样式类名
 */
const BASE_CONTAINER_CLASS =
  'flex items-center justify-center space-x-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer hover:bg-opacity-80';

/**
 * 离线队列指示器
 *
 * @description
 * 显示离线队列中的消息数量和同步状态
 * 点击可以触发自定义操作（如打开队列详情）
 *
 * @example
 * ```tsx
 * function MyToolbar() {
 *   const { queueService } = useOfflineMessage();
 *   const [count, setCount] = useState(0);
 *
 *   useEffect(() => {
 *     if (!queueService) return;
 *
 *     const unsubscribe = queueService.subscribe((messages) => {
 *       setCount(messages.length);
 *     });
 *
 *     return unsubscribe;
 *   }, [queueService]);
 *
 *   return (
 *     <OfflineQueueIndicator
 *       count={count}
 *       onClick={() => console.log('查看离线队列')}
 *     />
 *   );
 * }
 * ```
 */
export const OfflineQueueIndicator = memo(
  ({
    count,
    isSyncing = false,
    className = '',
    onClick,
    showLabel = true,
    label,
  }: OfflineQueueIndicatorProps) => {
    // 如果没有待发送的消息，不显示指示器
    if (count === 0 && !isSyncing) {
      return null;
    }

    // 根据状态选择样式
    const containerClass = cn(
      BASE_CONTAINER_CLASS,
      isSyncing
        ? 'bg-info/10 text-info animate-pulse'
        : 'bg-warning/10 text-warning',
      className,
    );

    const displayLabel =
      label ?? (count === 1 ? '1 条消息待发送' : `${count} 条消息待发送`);

    return (
      <button
        className={containerClass}
        onClick={onClick}
        aria-live="polite"
        aria-label={isSyncing ? '正在同步离线消息' : displayLabel}
        type="button"
      >
        {/* 图标 */}
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {isSyncing ? (
            // 同步中图标（旋转动画）
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="animate-spin"
            />
          ) : (
            // 离线队列图标
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3"
              />
            </>
          )}
        </svg>

        {/* 文本标签 */}
        {showLabel && <span>{isSyncing ? '同步中...' : displayLabel}</span>}

        {/* 数量徽章 */}
        {!isSyncing && count > 0 && (
          <span
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-xs font-bold text-white"
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    );
  },
);

OfflineQueueIndicator.displayName = 'OfflineQueueIndicator';

/**
 * 使用离线队列指示器的 Hook
 *
 * @description
 * 自动订阅离线队列状态，返回队列数量和同步状态
 *
 * @returns 队列状态
 *
 * @example
 * ```tsx
 * function MyToolbar() {
 *   const queueIndicator = useOfflineQueueIndicator();
 *
 *   return <OfflineQueueIndicator {...queueIndicator} />;
 * }
 * ```
 */
export function useOfflineQueueIndicator() {
  const { queueService } = useOfflineMessage();
  const [count, setCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!queueService) {
      return;
    }

    // 订阅队列变化
    const unsubscribe = queueService.subscribe((messages) => {
      setCount(messages.length);
    });

    return unsubscribe;
  }, [queueService]);

  return {
    count,
    isSyncing,
  };
}
