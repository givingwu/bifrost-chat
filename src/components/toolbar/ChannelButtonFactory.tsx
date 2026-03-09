import { Mail, MessageSquare, Phone, Smartphone } from 'lucide-react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
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
  const { t } = useTranslation();
  const labelKey = `toolbar.channel.${channel}`;
  const iconMap: Partial<Record<ChannelTypeEnum, React.ReactNode>> = {
    [ChannelTypeEnum.SMS]: <Smartphone className="h-4 w-4" />,
    [ChannelTypeEnum.WhatsApp]: <MessageSquare className="h-4 w-4" />,
    [ChannelTypeEnum.Email]: <Mail className="h-4 w-4" />,
    [ChannelTypeEnum.Viber]: <MessageSquare className="h-4 w-4" />,
    [ChannelTypeEnum.IVR]: <Phone className="h-4 w-4" />,
  };

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
      {iconMap[channel]}
      <span>{t(labelKey)}</span>
    </Button>
  );
};
