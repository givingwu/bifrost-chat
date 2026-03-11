import { memo } from 'react';
import { Button } from '@/components/Button';
import { useChannelIcon } from '@/hooks/use-channel-icon.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import { useChannelSwitcher } from '@/hooks/use-channel-switcher.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { cn } from '@/utils/class.util';

export interface ChannelSwitcherProps {
  /** 当前会话支持的渠道列表（可选） */
  supportedChannels?: ChannelTypeEnum[];
  /** 当前激活的渠道（从全局状态获取） */
  activeChannel?: ChannelTypeEnum;
  /** 渠道切换回调（可选，默认使用全局 action） */
  onChannelChange?: (channel: ChannelTypeEnum) => void;
  /** 紧凑模式（仅图标） */
  compact?: boolean;
}

/**
 * ChannelSwitcher：Composer 场景的渠道切换器（按钮组模式）。
 *
 * @description
 * - 按钮组平铺显示所有渠道
 * - 激活状态为蓝色背景 + 白色文字，非激活状态为灰色背景 + 灰色文字
 * - 点击渠道时更新全局 `activeChannel`，触发模板重新获取
 * - 支持紧凑模式（仅显示图标）
 *
 * @example
 * ```tsx
 * // 使用会话级别的 supportedChannels
 * <ChannelSwitcher
 *   supportedChannels={conversation.supportedChannels}
 *   activeChannel={activeChannel}
 * />
 *
 * // 使用全局的 allowedChannels
 * <ChannelSwitcher activeChannel={activeChannel} />
 *
 * // 紧凑模式
 * <ChannelSwitcher compact />
 * ```
 */
export const ChannelSwitcher = memo(
  ({
    supportedChannels,
    activeChannel: propActiveChannel,
    onChannelChange,
    compact = false,
  }: ChannelSwitcherProps) => {
    const { channels, activeChannel, handleChannelChange, shouldRender } =
      useChannelSwitcher({
        supportedChannels,
        activeChannel: propActiveChannel,
        onChannelChange,
      });

    const getLabel = useChannelLabel();
    const getIcon = useChannelIcon('sm');

    if (!shouldRender) {
      return null;
    }

    return (
      <div
        className={cn('flex', compact ? 'gap-1' : 'gap-1.5', 'items-center')}
      >
        {channels.map((channel) => {
          const isActive = channel === activeChannel;
          const icon = getIcon(channel);
          const label = getLabel(channel);

          return (
            <Button
              type="button"
              data-channel={channel}
              key={channel}
              onClick={() => handleChannelChange(channel)}
              className={cn(
                'flex items-center transition-all duration-200',
                compact
                  ? 'justify-center w-5 h-5 rounded-md'
                  : 'gap-1.5 px-1.5 py-1 rounded-md',
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/20',
              )}
              title={compact ? label : undefined}
            >
              <span className="transition-all duration-200">{icon}</span>
              {!compact && <span className="text-xs">{label}</span>}
            </Button>
          );
        })}
      </div>
    );
  },
);

ChannelSwitcher.displayName = 'ChannelSwitcher';
