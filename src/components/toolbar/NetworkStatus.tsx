import { memo, useMemo } from 'react';
import { NetworkStatusEnum } from '@/interfaces/network.interface';
import { useTranslation } from '@/providers/I18n.provider';
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
 * 网络状态样式配置接口（仅包含纯样式，文案由 i18n 提供）
 */
interface NetworkStatusStyleConfig {
  /** 容器样式类名 */
  containerClass: string;
  /** 状态指示点样式类名 */
  dotClass: string;
  /** i18n key 后缀（对应 toolbar.network.xxx） */
  i18nKey: string;
}

/**
 * 网络状态到样式配置的映射表
 * - label / ariaLabel 已移至 locale JSON，通过 t() 获取
 */
export const NETWORK_STATUS_STYLE_MAP: Record<
  NetworkStatusEnum,
  NetworkStatusStyleConfig
> = {
  [NetworkStatusEnum.Unknown]: {
    containerClass: 'bg-muted text-text-muted',
    dotClass: 'bg-text-muted',
    i18nKey: 'unknown',
  },
  [NetworkStatusEnum.Connected]: {
    containerClass: 'bg-success/10 text-success',
    dotClass: 'bg-success',
    i18nKey: 'connected',
  },
  [NetworkStatusEnum.Connecting]: {
    containerClass: 'bg-warning/10 text-warning',
    dotClass: 'bg-warning animate-pulse',
    i18nKey: 'connecting',
  },
  [NetworkStatusEnum.Disconnected]: {
    containerClass: 'bg-error/10 text-error',
    dotClass: 'bg-error',
    i18nKey: 'disconnected',
  },
  [NetworkStatusEnum.Reconnecting]: {
    containerClass: 'bg-info/10 text-info',
    dotClass: 'bg-info animate-pulse',
    i18nKey: 'reconnecting',
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
 * - 使用 i18n 国际化所有文案（label 和 ariaLabel）。
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
    const { t } = useTranslation();

    // 使用 useMemo 缓存配置选择结果
    const config = useMemo(() => {
      const config = NETWORK_STATUS_STYLE_MAP[status];

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

    const { containerClass, dotClass, i18nKey } = config;

    // 通过 i18n 获取标签和 ARIA 文案
    const label = customLabel ?? t(`toolbar.network.${i18nKey}`);
    const ariaLabel = t(`toolbar.network.aria.${i18nKey}`);

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
        {showLabel && <span>{label}</span>}
      </output>
    );
  },
);

NetworkStatus.displayName = 'NetworkStatus';
