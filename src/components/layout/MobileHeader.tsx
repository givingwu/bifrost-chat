import { X } from 'lucide-react';
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import {
  CHANNEL_BRAND_COLOR,
  ChannelIcon,
} from '@/components/toolbar/ChannelIcon';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';

export interface MobileHeaderProps {
  title: ReactNode;
  subTitle: ReactNode;
  avatarUrl: string | undefined;
  channel: ChannelTypeEnum;
  loading?: boolean;
  showCloseButton: boolean;
  onClose?: () => void;
}

function MobileHeaderSkeleton({
  brandColor,
  showCloseButton,
}: {
  brandColor: string;
  showCloseButton: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 flex min-h-20 shrink-0 animate-pulse items-center justify-between gap-4 px-5 py-3 shadow-soft"
      style={{ backgroundColor: brandColor }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-md bg-white/20" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-28 rounded bg-white/20" />
          <div className="mt-1.5 h-3 w-20 rounded bg-white/15" />
        </div>
      </div>
      {showCloseButton && (
        <div className="h-9 w-9 shrink-0 rounded-full bg-white/10" />
      )}
    </div>
  );
}

export function MobileHeader({
  title,
  subTitle,
  avatarUrl,
  channel,
  loading = false,
  showCloseButton,
  onClose,
}: MobileHeaderProps) {
  const { t } = useTranslation();
  const brandColor = CHANNEL_BRAND_COLOR[channel];

  const headerStyle = useMemo<CSSProperties>(
    () => ({ backgroundColor: brandColor }),
    [brandColor],
  );

  if (loading) {
    return (
      <MobileHeaderSkeleton
        brandColor={brandColor}
        showCloseButton={showCloseButton}
      />
    );
  }

  return (
    <header
      className="relative z-10 flex min-h-20 shrink-0 items-center justify-between gap-4 px-5 py-3 shadow-soft"
      style={headerStyle}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 text-white">
            <ChannelIcon channel={channel} size="sm" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold leading-5 text-white">
            {title}
          </h2>
          <p className="mt-0.5 truncate text-xs text-white/70">{subTitle}</p>
        </div>
      </div>

      {showCloseButton && (
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </header>
  );
}
