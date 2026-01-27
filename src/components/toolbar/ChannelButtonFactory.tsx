import type { ChannelType } from '@/interfaces/chat.interface';
import { useTranslation } from '@/providers/I18nProvider';

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
  return (
    <button
      type="button"
      data-channel={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition ${
        disabled
          ? 'cursor-not-allowed border-border/60 text-text-muted'
          : 'hover:border-primary hover:text-primary'
      }`}
      onClick={() => onClick?.(type)}
    >
      {t(labelKey)}
    </button>
  );
};
