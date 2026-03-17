import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useChannelIcon } from '@/hooks/use-channel-icon.hook';
import { useChannelLabel } from '@/hooks/use-channel-label.hook';
import { useChannelSwitcher } from '@/hooks/use-channel-switcher.hook';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';

export interface ChannelBadgeSwitcherProps {
  /** 当前会话支持的渠道列表（可选） */
  supportedChannels?: ChannelTypeEnum[];
  /** 当前激活的渠道（从全局状态获取） */
  activeChannel?: ChannelTypeEnum;
  /** 渠道切换回调（可选，默认使用全局 action） */
  onChannelChange?: (channel: ChannelTypeEnum) => void;
}

/**
 * ChannelBadgeSwitcher：徽章模式的渠道切换器。
 *
 * @description
 * - 点击徽章弹出上拉菜单选择渠道
 * - 触发按钮应用徽章样式 `rounded-full border border-border px-2.5 py-1`
 * - 选择渠道后自动关闭菜单
 * - 支持 ESC 键和外部点击关闭
 *
 * @example
 * ```tsx
 * <ChannelBadgeSwitcher
 *   supportedChannels={conversation.supportedChannels}
 *   activeChannel={activeChannel}
 * />
 * ```
 */
export const ChannelBadgeSwitcher = memo(
  ({
    supportedChannels,
    activeChannel: propActiveChannel,
    onChannelChange,
  }: ChannelBadgeSwitcherProps) => {
    const {
      channels,
      activeChannel,
      channelStates,
      switchingChannel,
      handleChannelChange,
      shouldRender,
    } = useChannelSwitcher({
      supportedChannels,
      activeChannel: propActiveChannel,
      onChannelChange,
    });

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 处理渠道选择
    const handleChannelClick = useCallback(
      async (channel: ChannelTypeEnum) => {
        if (channelStates[channel]?.disabled) {
          return;
        }

        await handleChannelChange(channel);
        setIsOpen(false);
      },
      [channelStates, handleChannelChange],
    );

    // 处理触发按钮点击
    const handleTriggerClick = useCallback(() => {
      setIsOpen((prev) => !prev);
    }, []);

    // 处理外部点击和 ESC 键关闭
    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const getIcon = useChannelIcon('sm');
    const getLabel = useChannelLabel();
    const { t } = useTranslation();

    if (!shouldRender) {
      return null;
    }

    const activeIcon = activeChannel ? getIcon(activeChannel) : null;
    const activeLabel = activeChannel ? getLabel(activeChannel) : '';

    return (
      <div ref={containerRef} className="relative">
        {/* 触发按钮 - 应用徽章样式 */}
        <button
          type="button"
          onClick={handleTriggerClick}
          className={cn(
            'rounded-full border border-border px-2.5 py-1',
            'flex items-center gap-1.5',
            'text-[10px] text-gray-400 dark:text-gray-500',
            'hover:bg-gray-100 dark:hover:bg-white/10',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/40',
          )}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <span className="transition-all duration-200">{activeIcon}</span>
          <span>{activeLabel}</span>
        </button>

        {/* 弹出菜单 - 上拉显示 */}
        {isOpen && (
          <div
            className={cn(
              'absolute bottom-full mb-2 left-0',
              'z-50',
              'min-w-max',
              'rounded-xl border border-border bg-card shadow-lg',
              'animate-in fade-in slide-in-from-bottom-2 duration-200',
            )}
            role="menu"
            aria-label={t('composer.aria.chooseChannel')}
          >
            <div className="p-1">
              {channels.map((channel) => {
                const isActive = channel === activeChannel;
                const isDisabled = !!channelStates[channel]?.disabled;
                const icon = getIcon(channel);
                const label = getLabel(channel);
                const tooltip = channelStates[channel]?.tooltip ?? label;

                return (
                  <button
                    type="button"
                    key={channel}
                    onClick={() => {
                      void handleChannelClick(channel);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg',
                      'w-full text-left transition-all duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-primary/40',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-text',
                      isDisabled &&
                        'cursor-not-allowed opacity-50 hover:bg-transparent',
                      switchingChannel === channel && 'opacity-70',
                    )}
                    role="menuitem"
                    aria-current={isActive ? 'true' : undefined}
                    aria-disabled={isDisabled || undefined}
                    title={tooltip}
                  >
                    <span className="transition-all duration-200">{icon}</span>
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  },
);

ChannelBadgeSwitcher.displayName = 'ChannelBadgeSwitcher';
