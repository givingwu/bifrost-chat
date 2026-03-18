import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { TRANSLATION_KEYS } from '@/utils/layout.util';

/**
 * 不支持渠道的警告提示组件 Props
 */
export interface UnsupportedChannelWarningProps {
  /** 当前渠道 */
  channel: ChannelTypeEnum;
}

/**
 * 不支持渠道的警告提示组件
 *
 * 当当前会话不支持选中的渠道时显示此警告。
 */
export function UnsupportedChannelWarning({
  channel,
}: UnsupportedChannelWarningProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-center px-4 py-3 bg-amber-50/80 dark:bg-amber-900/20 border-t border-amber-200/50 dark:border-amber-700/30 text-amber-700 dark:text-amber-400 text-sm"
      role="alert"
    >
      <svg
        className="w-4 h-4 mr-2 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      {t(TRANSLATION_KEYS.TOOLBAR_CHANNEL_FILTER, {
        channel: t(`${TRANSLATION_KEYS.TOOLBAR_CHANNEL}.${channel}`),
      })}
    </div>
  );
}
