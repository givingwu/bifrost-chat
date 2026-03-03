import { Mail, MessageSquare, Phone, Smartphone } from 'lucide-react';
import type React from 'react';
import { memo, useMemo } from 'react';
import type { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { cn } from '@/utils/class.util';

export interface ChannelFilterProps {
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatusEnum;
  /** 允许的渠道列表 */
  channels: readonly ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel?: ChannelTypeEnum;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelTypeEnum) => void;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 紧凑模式（仅图标） */
  compact?: boolean;
}

export const iconMap: Partial<Record<ChannelTypeEnum, React.ReactNode>> = {
  [ChannelTypeEnum.SMS]: <Smartphone className="h-3 w-3" />,
  [ChannelTypeEnum.WhatsApp]: <MessageSquare className="h-3 w-3" />,
  [ChannelTypeEnum.Email]: <Mail className="h-3 w-3" />,
  [ChannelTypeEnum.Waba]: <MessageSquare className="h-3 w-3" />,
  [ChannelTypeEnum.Viber]: <MessageSquare className="h-3 w-3" />,
  [ChannelTypeEnum.IVR]: <Phone className="h-3 w-3" />,
};

export const labelMap: Record<ChannelTypeEnum, string> = {
  [ChannelTypeEnum.SMS]: 'SMS',
  [ChannelTypeEnum.WhatsApp]: 'WhatsApp',
  [ChannelTypeEnum.Email]: 'Email',
  [ChannelTypeEnum.Waba]: 'WABA',
  [ChannelTypeEnum.Viber]: 'Viber',
  [ChannelTypeEnum.IVR]: 'IVR',
};

export const getChannelLabel = (channel: ChannelTypeEnum) => {
  return labelMap[channel] || channel;
};

/**
 * ChannelFilter：策略驱动的渠道切换器（Apple 风格 Segmented Control）。
 *
 * @description
 * - 紧凑的胶囊形状设计，仅显示图标节省空间
 * - 带有 300ms 平滑过渡的滑动白色指示器
 * - 悬停时显示完整渠道名称的工具提示
 * - 完全支持亮色/暗色模式切换
 * - 磨砂玻璃效果（backdrop-blur-md）
 *
 * @example
 * ```tsx
 * <ChannelFilter
 *   channels={allowedChannels}
 *   activeChannel={activeChannel}
 *   onChannelClick={setActiveChannel}
 *   compact
 *   showTooltip
 * />
 * ```
 */
export const ChannelFilter = memo(
  ({
    channels,
    activeChannel,
    onChannelClick,
    showTooltip = true,
    compact = true,
  }: ChannelFilterProps) => {
    const activeIndex = useMemo(
      () => channels.findIndex((channel) => channel === activeChannel),
      [channels, activeChannel],
    );

    return (
      <fieldset
        aria-label="渠道切换器"
        className="relative inline-flex items-center rounded-full p-0.5 bg-gray-200/80 dark:bg-white/10 backdrop-blur-md border border-gray-300/50 dark:border-white/20 shadow-sm"
      >
        {/* Sliding indicator - 仅在多渠道时显示 */}
        {channels.length > 1 && activeIndex >= 0 && (
          <div
            role="presentation"
            className="absolute top-0.5 bottom-0.5 rounded-full bg-white dark:bg-white/20 shadow-md transition-all duration-300 ease-out"
            style={{
              width: `calc(${100 / channels.length}% - 4px)`,
              left: `calc(${activeIndex * (100 / channels.length)}% + 2px)`,
            }}
          />
        )}

        {/* Channel buttons */}
        {channels.map((channel) => {
          const isActive = channel === activeChannel;
          const icon = iconMap[channel];
          const label = getChannelLabel(channel);

          return (
            <button
              type="button"
              data-channel={channel}
              key={channel}
              onClick={() => onChannelClick?.(channel)}
              aria-label={label}
              aria-pressed={isActive}
              className={cn(
                'relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 group',
                'min-w-[40px]',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
              )}
              title={channel}
            >
              <span className="transition-all duration-200">{icon}</span>
              {/* Label in non-compact mode */}
              {!compact && <span className="ml-1">{label}</span>}
              {/* Tooltip on hover */}
              {showTooltip && (
                <span
                  role="tooltip"
                  className={cn(
                    'absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200',
                    'group-hover:opacity-100',
                  )}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </fieldset>
    );
  },
);

ChannelFilter.displayName = 'ChannelFilter';
