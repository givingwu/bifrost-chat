import {
  AlertCircle,
  Check,
  CheckCheck,
  CheckLine,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';

export interface StatusIndicatorProps {
  /** 消息状态 */
  status?: MessageStatusEnum;
  /** 自定义类名 */
  className?: string;
  /** 是否显示动画（仅对发送中状态有效） */
  animate?: boolean;
  /** 是否显示悬浮状态提示 */
  showTooltip?: boolean;
}

/**
 * 状态配置接口
 */
interface StatusConfig {
  /** 图标组件 */
  icon: LucideIcon;
  /** 图标大小 */
  size: string;
  /** 图标颜色类名 */
  colorClass: string;
  /** 是否需要动画 */
  animate?: boolean;
  /** ARIA 标签，用于无障碍访问 */
  label: string;
  /** Tooltip 文案 */
  tooltip: string;
}

/**
 * StatusIndicator：消息状态指示器。
 * - 显示消息的发送状态（创建中、发送中、失败、已读、已送达、已发送）。
 * - 使用配置对象模式，便于统一管理和扩展状态样式。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const StatusIndicator = memo(
  ({
    status,
    className = '',
    animate = true,
    showTooltip = true,
  }: StatusIndicatorProps) => {
    const { t } = useTranslation();

    // 使用 useMemo 缓存配置选择结果
    const config = useMemo<StatusConfig | null>(() => {
      if (!status) {
        return null;
      }

      // 根据状态生成配置（使用翻译）
      const statusConfigMap: Record<
        MessageStatusEnum,
        Omit<StatusConfig, 'label' | 'tooltip'>
      > = {
        [MessageStatusEnum.Queued]: {
          icon: Loader2,
          size: 'h-4 w-4',
          colorClass: 'text-primary/50',
          animate: true,
        },
        [MessageStatusEnum.Created]: {
          icon: Loader2,
          size: 'h-4 w-4',
          colorClass: 'text-primary/60',
          animate: true,
        },
        [MessageStatusEnum.Sending]: {
          icon: Loader2,
          size: 'h-4 w-4',
          colorClass: 'text-primary/80',
          animate: true,
        },
        [MessageStatusEnum.Sent]: {
          icon: Check,
          size: 'h-4 w-4',
          colorClass: 'text-primary/80',
        },
        [MessageStatusEnum.Delivered]: {
          icon: CheckLine,
          size: 'h-4 w-4',
          colorClass: 'text-primary/80',
        },
        [MessageStatusEnum.Read]: {
          icon: CheckCheck,
          size: 'h-4 w-4',
          colorClass: 'text-green-500/80',
        },
        [MessageStatusEnum.Failed]: {
          icon: AlertCircle,
          size: 'h-4 w-4',
          colorClass: 'text-error',
        },
      } as const;

      const baseConfig = statusConfigMap[status];
      if (!baseConfig) {
        console.warn(`[StatusIndicator] Unknown message status: ${status}`);
        return null;
      }

      const statusKey = `message.status.${status.toLowerCase()}`;
      const translatedLabel = t(statusKey);
      const label = translatedLabel === statusKey ? status : translatedLabel;

      const tooltipKey = 'message.status.tooltip';
      const translatedTooltip = t(tooltipKey, { status: label });
      const tooltip =
        translatedTooltip === tooltipKey ? label : translatedTooltip;

      // 添加翻译文案
      return {
        ...baseConfig,
        label,
        tooltip,
      };
    }, [status, t]);

    if (!config) return null;

    const {
      icon: Icon,
      size,
      colorClass,
      animate: shouldAnimate,
      label,
      tooltip,
    } = config;

    // 构建类名
    const iconClassName = `${size} ${colorClass} ${
      shouldAnimate && animate ? 'animate-spin' : ''
    } ${className}`.trim();

    return (
      <span title={showTooltip ? tooltip : undefined}>
        <Icon className={iconClassName} aria-label={label} aria-live="polite" />
      </span>
    );
  },
);

StatusIndicator.displayName = 'StatusIndicator';
