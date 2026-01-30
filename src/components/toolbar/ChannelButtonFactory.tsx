import { Mail, MessageSquare, Smartphone } from 'lucide-react';
import { ChannelType } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface ChannelButtonFactoryProps {
  /** 渠道类型 */
  channel: ChannelType;
  /** 当前激活的渠道 */
  active?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: (type: ChannelType) => void;
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
  const iconMap: Record<ChannelType, React.ReactNode> = {
    [ChannelType.SMS]: <Smartphone className="h-4 w-4" />,
    [ChannelType.WhatsApp]: <MessageSquare className="h-4 w-4" />,
    [ChannelType.Email]: <Mail className="h-4 w-4" />,
  };

  return (
    <button
      type="button"
      data-channel={channel}
      disabled={disabled}
      className={cn(
        'flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
        active
          ? 'bg-card text-primary shadow-sm dark:bg-card/80'
          : 'text-text-muted hover:bg-muted/60',
      )}
      onClick={() => onClick?.(channel)}
    >
      {iconMap[channel]}
      <span>{t(labelKey)}</span>
    </button>
  );
};
