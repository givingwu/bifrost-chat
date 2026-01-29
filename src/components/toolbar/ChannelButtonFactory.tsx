import {
  Mail,
  MessageSquare,
  MessagesSquare,
  Phone,
  Smartphone,
} from 'lucide-react';
import type { ChannelType } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface ChannelButtonFactoryProps {
  /** 渠道类型 */
  type: ChannelType;
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
  type,
  disabled,
  onClick,
}: ChannelButtonFactoryProps) => {
  const { t } = useTranslation();
  const labelKey = `toolbar.channel.${type}`;
  const iconMap: Record<ChannelType, React.ReactNode> = {
    sms: <Smartphone className="h-4 w-4" />,
    whatsapp: <MessageSquare className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    voip: <Phone className="h-4 w-4" />,
    facebook_messenger: <MessagesSquare className="h-4 w-4" />,
  };
  return (
    <button
      type="button"
      data-channel={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition',
        'border border-border bg-muted/60 text-text',
        disabled
          ? 'cursor-not-allowed border-border/60 text-text-muted'
          : 'hover:border-primary hover:bg-card hover:text-primary',
      )}
      onClick={() => onClick?.(type)}
    >
      {iconMap[type]}
      <span>{t(labelKey)}</span>
    </button>
  );
};
