import {
  CHANNEL_BRAND_COLOR,
  useChannelIcon,
} from '@/hooks/use-channel-icon.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';

/**
 * ChannelBadge：会话列表头像右下角的渠道标识徽标
 *
 * 图标来自 useChannelIcon（统一 outline 风格），
 * 背景色来自 CHANNEL_BRAND_COLOR（各渠道品牌色），
 * aria-label 来自 useChannelLabel（支持 i18n）。
 */
export const ChannelBadge = ({ type }: { type: ChannelTypeEnum }) => {
  const getIcon = useChannelIcon('xs');
  const getLabel = useChannelLabel();

  const icon = getIcon(type);
  if (!icon) return null;

  return (
    <div
      role="img"
      className="rounded-full p-0.5 text-white"
      style={{ backgroundColor: CHANNEL_BRAND_COLOR[type] }}
      aria-label={getLabel(type)}
      title={getLabel(type)}
    >
      {icon}
    </div>
  );
};
