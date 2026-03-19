import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { TRANSLATION_KEYS } from '@/utils/layout.util';

/**
 * 不支持渠道的警告提示组件 Props
 */
export interface UnsupportedChannelWarningProps {
  /** 当前渠道 */
  channel: ChannelTypeEnum;
  /** 布局模式：horizontal 用于 Composer 区域，vertical 用于模板面板 */
  variant?: 'horizontal' | 'vertical';
}

/**
 * 不支持渠道的警告提示组件
 *
 * 当当前会话不支持选中的渠道时显示此警告。
 *
 * @example
 * ```tsx
 * // 横向布局（默认，用于 Composer 区域）
 * <UnsupportedChannelWarning channel="whatsapp" />
 *
 * // 纵向布局（用于模板面板等垂直空间）
 * <UnsupportedChannelWarning channel="whatsapp" variant="vertical" />
 * ```
 */
export function UnsupportedChannelWarning({
  channel,
  variant = 'horizontal',
}: UnsupportedChannelWarningProps) {
  const { t } = useTranslation();

  const isVertical = variant === 'vertical';

  return (
    <div
      className={cn(
        'flex items-center justify-center text-amber-700 dark:text-amber-400',
        isVertical
          ? 'flex-col h-full gap-2 px-4 py-3 text-center'
          : 'flex-row px-4 py-3 bg-amber-50/80 dark:bg-amber-900/20 border-t border-amber-200/50 dark:border-amber-700/30 text-sm',
      )}
      role="alert"
    >
      <svg
        className={cn(
          'shrink-0',
          isVertical ? 'w-8 h-8 text-amber-500' : 'w-4 h-4 mr-2',
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isVertical ? 1.5 : 2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <p
        className={cn(isVertical && 'text-sm text-gray-500 dark:text-gray-400')}
      >
        {t(TRANSLATION_KEYS.TOOLBAR_CHANNEL_FILTER, {
          channel: t(`${TRANSLATION_KEYS.TOOLBAR_CHANNEL}.${channel}`),
        })}
      </p>
    </div>
  );
}
