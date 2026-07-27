import { type CSSProperties, memo, useMemo } from 'react';
import { Button } from '@/components/Button';
import {
  CHANNEL_BRAND_COLOR,
  useChannelIcon,
} from '@/hooks/use-channel-icon.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import type { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface ChannelFilterProps {
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatusEnum;
  /** 允许的渠道列表 */
  channels: readonly ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel: ChannelTypeEnum;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelTypeEnum) => void;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 紧凑模式（仅图标） */
  compact?: boolean;
  /** 移动端模式（横向滚动文字列表） */
  mobile?: boolean;
  /**
   * 各渠道未读数量，key = ChannelTypeEnum，value = 未读条数
   * 传入时显示 badge，不传则不显示
   *
   * @example
   * ```tsx
   * const unreadByChannel = useChannelUnread(channels);
   * <ChannelFilter unreadByChannel={unreadByChannel} ... />
   * ```
   */
  unreadByChannel?: Partial<Record<ChannelTypeEnum, number>>;
  /**
   * 禁用的渠道及其 tooltip 提示，key = ChannelTypeEnum，value = tooltip 文案。
   * 匹配的渠道按钮会置灰且不可点击，鼠标悬停显示自定义 tooltip。
   */
  disabledChannels?: Partial<Record<ChannelTypeEnum, string>>;
  /** 自定义容器类名 */
  className?: string;
  /** 自定义容器样式 */
  style?: CSSProperties;
}

export interface ChannelFilterProps {
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatusEnum;
  /** 允许的渠道列表 */
  channels: readonly ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel: ChannelTypeEnum;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelTypeEnum) => void;
  /** 是否显示工具提示 */
  showTooltip?: boolean;
  /** 紧凑模式（仅图标） */
  compact?: boolean;
  /**
   * 各渠道未读数量，key = ChannelTypeEnum，value = 未读条数
   * 传入时显示 badge，不传则不显示
   *
   * @example
   * ```tsx
   * const unreadByChannel = useChannelUnread(channels);
   * <ChannelFilter unreadByChannel={unreadByChannel} ... />
   * ```
   */
  unreadByChannel?: Partial<Record<ChannelTypeEnum, number>>;
  /**
   * 禁用的渠道及其 tooltip 提示，key = ChannelTypeEnum，value = tooltip 文案。
   * 匹配的渠道按钮会置灰且不可点击，鼠标悬停显示自定义 tooltip。
   */
  disabledChannels?: Partial<Record<ChannelTypeEnum, string>>;
  /** 自定义容器类名 */
  className?: string;
  /** 自定义容器样式 */
  style?: CSSProperties;
}

/**
 * ChannelFilter：策略驱动的渠道切换器。
 *
 * @description
 * 桌面端：Apple 风格 Segmented Control，紧凑的胶囊形状设计，仅显示图标节省空间
 * 移动端：横向滚动的文字列表，active 用 primary color 高亮
 *
 * @example
 * ```tsx
 * // 桌面端
 * <ChannelFilter
 *   channels={allowedChannels}
 *   activeChannel={activeChannel}
 *   onChannelClick={handleChannelChange}
 *   unreadByChannel={useChannelUnread(allowedChannels)}
 *   compact
 *   showTooltip
 * />
 *
 * // 移动端
 * <ChannelFilter
 *   channels={allowedChannels}
 *   activeChannel={activeChannel}
 *   onChannelClick={handleChannelChange}
 *   unreadByChannel={useChannelUnread(allowedChannels)}
 *   mobile
 * />
 * ```
 */
export const ChannelFilter = memo(
  ({
    channels,
    activeChannel,
    onChannelClick,
    showTooltip = true,
    compact = true,
    mobile = false,
    unreadByChannel,
    disabledChannels,
    className,
    style,
  }: ChannelFilterProps) => {
    const { t } = useTranslation();
    const getLabel = useChannelLabel();
    const getIcon = useChannelIcon('sm');
    const activeIndex = useMemo(
      () => channels.indexOf(activeChannel),
      [channels, activeChannel],
    );

    // 移动端模式：横向滚动文字列表
    if (mobile) {
      return (
        <div
          className={cn('flex gap-2 overflow-x-auto scrollbar-hide', className)}
          style={style}
        >
          {channels.map((channel) => {
            const isActive = channel === activeChannel;
            const label = getLabel(channel);
            const count = unreadByChannel?.[channel] ?? 0;
            const isDisabled = !!disabledChannels?.[channel];

            return (
              <button
                type="button"
                data-channel={channel}
                key={channel}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onChannelClick?.(channel);
                  }
                }}
                aria-label={label}
                aria-pressed={isActive}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  'shrink-0',
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : isActive
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
                )}
                style={
                  isActive ? { color: CHANNEL_BRAND_COLOR[channel] } : undefined
                }
              >
                <span>{label}</span>
                {/* Unread badge */}
                {unreadByChannel && count > 0 && (
                  <span
                    role="tooltip"
                    aria-label={t('toolbar.channelFilter.unread', { count })}
                    className={cn(
                      'absolute top-0.5 right-0.5 z-20',
                      'min-w-4 h-4 px-1',
                      'flex items-center justify-center',
                      'rounded-full bg-red-500 text-white text-xs font-bold leading-none',
                      'ring-1 ring-white dark:ring-gray-900',
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    // 桌面端模式：Segmented Control
    return (
      <fieldset
        aria-label={t('toolbar.channelFilter.ariaLabel')}
        className={cn(
          'relative inline-flex items-center rounded-full p-0.5 bg-gray-100 dark:bg-white/8 backdrop-blur-md border border-gray-300/60 dark:border-white/15 shadow-sm',
          className,
        )}
        style={style}
      >
        {/* Sliding indicator - 仅在多渠道时显示 */}
        {channels.length > 1 && activeIndex >= 0 && (
          <div
            role="presentation"
            className="absolute top-0.5 bottom-0.5 rounded-full bg-white dark:bg-primary/20 shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 ease-out"
            style={{
              width: `calc(${100 / channels.length}% - 4px)`,
              left: `calc(${activeIndex * (100 / channels.length)}% + 2px)`,
            }}
          />
        )}

        {/* Channel buttons */}
        {channels.map((channel) => {
          const isActive = channel === activeChannel;
          const icon = getIcon(channel);
          const label = getLabel(channel);
          const count = unreadByChannel?.[channel] ?? 0;
          const disabledTooltip = disabledChannels?.[channel];
          const isDisabled = !!disabledTooltip;

          return (
            <Button
              type="button"
              data-channel={channel}
              key={channel}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onChannelClick?.(channel);
                }
              }}
              aria-label={label}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
              className={cn(
                'relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 group',
                'min-w-10',
                isDisabled
                  ? 'opacity-40 cursor-not-allowed'
                  : isActive
                    ? 'text-white font-semibold cursor-pointer'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
              )}
              style={
                isActive && !isDisabled
                  ? { backgroundColor: CHANNEL_BRAND_COLOR[channel] }
                  : undefined
              }
              title={disabledTooltip ?? label}
            >
              <span className="transition-all duration-200">{icon}</span>
              {/* Unread badge：有数据且 > 0 才显示 */}
              {unreadByChannel && count > 0 && (
                <span
                  role="tooltip"
                  aria-label={t('toolbar.channelFilter.unread', { count })}
                  className={cn(
                    'absolute -top-1 -right-1 z-20',
                    'min-w-3.5 h-3.5 px-0.5',
                    'flex items-center justify-center',
                    'rounded-full bg-red-500 text-white text-[9px] font-bold leading-none',
                    'ring-1 ring-white dark:ring-gray-900',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
              {/* Label in non-compact mode */}
              {!compact && <span className="ml-1">{label}</span>}
              {/* Tooltip on hover */}
              {showTooltip && (
                <span
                  role="tooltip"
                  className={cn(
                    'absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200',
                    'group-hover:opacity-100',
                  )}
                >
                  {disabledTooltip ?? label}
                </span>
              )}
            </Button>
          );
        })}
      </fieldset>
    );
  },
);

ChannelFilter.displayName = 'ChannelFilter';
