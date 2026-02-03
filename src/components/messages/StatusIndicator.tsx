import {
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { MessageStatus } from '@/interfaces/message.interface';

export interface StatusIndicatorProps {
  /** 消息状态 */
  status?: MessageStatus;
  /** 自定义类名 */
  className?: string;
  /** 是否显示动画（仅对发送中状态有效） */
  animate?: boolean;
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
  ariaLabel: string;
}

/**
 * 消息状态到配置的映射表
 * - 使用配置对象模式，便于统一管理和扩展
 * - 包含所有已知的消息状态配置
 */
const STATUS_CONFIG_MAP: Record<MessageStatus, StatusConfig> = {
  [MessageStatus.Created]: {
    icon: Loader2,
    size: 'h-3 w-3',
    colorClass: 'text-white/50',
    animate: true,
    ariaLabel: '消息创建中',
  },
  [MessageStatus.Sending]: {
    icon: Loader2,
    size: 'h-3 w-3',
    colorClass: 'text-white/70',
    animate: true,
    ariaLabel: '消息发送中',
  },
  [MessageStatus.Sent]: {
    icon: Check,
    size: 'h-4 w-4',
    colorClass: 'text-white/50',
    ariaLabel: '消息已发送',
  },
  [MessageStatus.Delivered]: {
    icon: CheckCheck,
    size: 'h-4 w-4',
    colorClass: 'text-white/50',
    ariaLabel: '消息已送达',
  },
  [MessageStatus.Read]: {
    icon: CheckCheck,
    size: 'h-4 w-4',
    colorClass: 'text-primary/80',
    ariaLabel: '消息已读',
  },
  [MessageStatus.Failed]: {
    icon: AlertCircle,
    size: 'h-4 w-4',
    colorClass: 'text-error',
    ariaLabel: '消息发送失败',
  },
} as const;

/**
 * StatusIndicator：消息状态指示器。
 * - 显示消息的发送状态（创建中、发送中、失败、已读、已送达、已发送）。
 * - 使用配置对象模式，便于统一管理和扩展状态样式。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持无障碍访问（ARIA 标签）。
 */
export const StatusIndicator = memo(
  ({ status, className = '', animate = true }: StatusIndicatorProps) => {
    // 使用 useMemo 缓存配置选择结果
    const config = useMemo(() => {
      if (!status) {
        return null;
      }

      const config = STATUS_CONFIG_MAP[status];
      if (!config) {
        console.warn(`[StatusIndicator] Unknown message status: ${status}`);
        return null;
      }

      return config;
    }, [status]);

    // 如果没有配置，返回 null
    if (!config) {
      return null;
    }

    const {
      icon: Icon,
      size,
      colorClass,
      animate: shouldAnimate,
      ariaLabel,
    } = config;

    // 构建类名
    const iconClassName = `${size} ${colorClass} ${
      shouldAnimate && animate ? 'animate-spin' : ''
    } ${className}`.trim();

    return (
      <Icon
        className={iconClassName}
        aria-label={ariaLabel}
        aria-live="polite"
      />
    );
  },
);

StatusIndicator.displayName = 'StatusIndicator';
