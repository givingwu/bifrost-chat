import type React from 'react';
import {
  CHANNEL_BRAND_COLOR,
  ChannelIcon,
  type ChannelIconSize,
} from '@/components/toolbar/ChannelIcon';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';

export { CHANNEL_BRAND_COLOR };
export type { ChannelIconSize };

/**
 * useChannelIcon：返回渠道图标获取函数。
 *
 * @param size 图标尺寸，默认 `sm`。
 * @returns 按渠道类型返回 ReactNode 的函数；未知渠道返回 null。
 *
 * @example
 * ```tsx
 * const getIcon = useChannelIcon('md');
 * getIcon(ChannelTypeEnum.WhatsApp);
 * ```
 */
export const useChannelIcon = (size: ChannelIconSize = 'sm') => {
  return (channel: ChannelTypeEnum): React.ReactNode => (
    <ChannelIcon channel={channel} size={size} />
  );
};
