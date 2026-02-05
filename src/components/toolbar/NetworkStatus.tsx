import { memo, useMemo } from 'react';
import { NetworkStatusEnum } from '@/interfaces/network.interface';
import { cn } from '@/utils/class.util';

export interface NetworkStatusProps {
  /** 网络状态 */
  status: NetworkStatusEnum;
  /** 自定义类名 */
  className?: string;
  /** 是否显示文本标签 */
  showLabel?: boolean;
  /** 自定义文本标签（可选） */
  label?: string;
}

/**
 * 网络状态配置接口
 */
interface NetworkStatusConfig {
  /** 状态文本标签 */
  label: string;
  /** 容器样式类名 */
  containerClass: string;
  /** 状态指示点样式类名 */
  dotClass: string;
  /** ARIA 标签，用于无障碍访问 */
  ariaLabel: string;
}

/**
 * 网络状态到配置的映射表
 * - 使用配置对象模式，便于统一管理和扩展
 * - 包含所有已知的网络状态配置
 * - 使用 as const 确保类型推断的准确性
 */
export const NETWORK_STATUS_CONFIG_MAP: Record<
  NetworkStatusEnum,
  NetworkStatusConfig
> = {
  [NetworkStatusEnum.Connected]: {
    label: 'Connected',
    containerClass: 'bg-success/10 text-success',
    dotClass: 'bg-success',
    ariaLabel: '网络已连接',
  },
  [NetworkStatusEnum.Connecting]: {
    label: 'Connecting',
    containerClass: 'bg-warning/10 text-warning',
    dotClass: 'bg-warning animate-pulse',
    ariaLabel: '网络连接中',
  },
  [NetworkStatusEnum.Disconnected]: {
    label: 'Disconnected',
    containerClass: 'bg-error/10 text-error',
    dotClass: 'bg-error',
    ariaLabel: '网络已断开',
  },
  [NetworkStatusEnum.Reconnecting]: {
    label: 'Reconnecting',
    containerClass: 'bg-info/10 text-info',
    dotClass: 'bg-info animate-pulse',
    ariaLabel: '网络重连中',
  },
} as const;

/**
 * 基础容器样式类名
 */
const BASE_CONTAINER_CLASS =
  'flex items-center justify-center space-x-2 rounded-full px-3 py-1.5 text-xs font-medium';

/**
 * 基础状态指示点样式类名
 */
const BASE_DOT_CLASS = 'h-2 w-2 rounded-full';

/**
 * NetworkStatus：网络连接状态指示器。
 * - 显示网络连接状态（已连接、连接中、已断开）。
 * - 使用配置对象模式，便于统一管理和扩展状态样式。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 * - 支持自定义标签和样式。
 */
export const NetworkStatus = memo(
  ({
    status,
    className = '',
    showLabel = true,
    label: customLabel,
  }: NetworkStatusProps) => {
    // 使用 useMemo 缓存配置选择结果
    const config = useMemo(() => {
      const config = NETWORK_STATUS_CONFIG_MAP[status];

      if (!config) {
        console.warn(`[NetworkStatus] Unknown network status: ${status}`);
        return null;
      }

      return config;
    }, [status]);

    // 如果配置不存在，返回 null
    if (!config) {
      return null;
    }

    const { label: defaultLabel, containerClass, dotClass, ariaLabel } = config;
    // 使用自定义标签或默认标签
    const displayLabel = customLabel ?? defaultLabel;
    // 构建容器类名
    const containerClassName = cn(
      BASE_CONTAINER_CLASS,
      containerClass,
      className,
    );
    // 构建状态指示点类名
    const dotClassName = cn(BASE_DOT_CLASS, dotClass);

    return (
      <output
        className={containerClassName}
        aria-live="polite"
        aria-label={ariaLabel}
      >
        <div className={dotClassName} aria-hidden="true" />
        {showLabel && <span>{displayLabel}</span>}
      </output>
    );
  },
);

NetworkStatus.displayName = 'NetworkStatus';
