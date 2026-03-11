import { Mail, MessageSquare, Phone, Smartphone } from 'lucide-react';
import type React from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

export type ChannelIconSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<ChannelIconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

type IconFactory = (className: string) => React.ReactElement;

const CHANNEL_ICON_MAP: Partial<Record<ChannelTypeEnum, IconFactory>> = {
  [ChannelTypeEnum.SMS]: (cls) => <Smartphone className={cls} />,
  [ChannelTypeEnum.WhatsApp]: (cls) => <MessageSquare className={cls} />,
  [ChannelTypeEnum.Email]: (cls) => <Mail className={cls} />,
  [ChannelTypeEnum.Viber]: (cls) => <MessageSquare className={cls} />,
  [ChannelTypeEnum.IVR]: (cls) => <Phone className={cls} />,
};

/**
 * useChannelIcon：返回渠道图标获取函数
 *
 * @param size 图标尺寸，默认 'sm'（h-3.5 w-3.5）
 *
 * @example
 * const getIcon = useChannelIcon();
 * getIcon(ChannelTypeEnum.SMS);        // <Smartphone className="h-3.5 w-3.5" />
 *
 * const getIcon = useChannelIcon('md');
 * getIcon(ChannelTypeEnum.WhatsApp);   // <MessageSquare className="h-4 w-4" />
 */
export const useChannelIcon = (size: ChannelIconSize = 'sm') => {
  const cls = SIZE_CLASS[size];

  return (channel: ChannelTypeEnum): React.ReactNode => {
    const factory = CHANNEL_ICON_MAP[channel];
    return factory ? factory(cls) : null;
  };
};
