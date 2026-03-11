import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useChannelIcon } from '@/hooks/use-channel-icon.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import { cn } from '@/utils/class.util';
import { Button } from '../Button';

export interface ChannelButtonFactoryProps {
  /** 渠道类型 */
  channel: ChannelTypeEnum;
  /** 当前激活的渠道 */
  active?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: (type: ChannelTypeEnum) => void;
}

/**
 * ChannelButtonFactory：渠道按钮工厂（Factory）。
 * - 仅提供骨架，具体样式由上层接入方覆盖。
 */
export const ChannelButtonFactory = ({
  channel,
  active,
  disabled,
  onClick,
}: ChannelButtonFactoryProps) => {
  const getLabel = useChannelLabel();
  const getIcon = useChannelIcon('md');

  return (
    <Button
      key={channel}
      data-channel={channel}
      disabled={disabled}
      className={cn(
        'shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
        active
          ? 'bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/20'
          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10',
      )}
      onClick={() => onClick?.(channel)}
    >
      {getIcon(channel)}
      <span>{getLabel(channel)}</span>
    </Button>
  );
};
