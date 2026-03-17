import { memo, type ReactNode, useMemo } from 'react';
import { useActiveConversationMetadata, useChannelUnread } from '@/hooks';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import {
  useActions,
  useConversation,
  useLanguage,
  useNetwork,
  useStrategy,
  useTheme,
} from '@/store';
import { ChannelFilter } from './ChannelFilter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NetworkStatus } from './NetworkStatus';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface ITopbarTools {
  extra?: ReactNode;
}

export interface ChannelStateDescriptor {
  disabled: boolean;
  tooltip: string;
}

/**
 * TopbarTools：会话顶部栏右侧工具集合。
 */
export const TopbarTools = memo(({ extra = null }: ITopbarTools) => {
  const { t } = useTranslation();
  const { activeConversationId } = useConversation();
  const { activeChannel, allowedChannels } = useStrategy();
  const { mode, enableSwitcher: showThemeSwitcher } = useTheme();
  const { metadata, isFetching } = useActiveConversationMetadata();
  const { code, enableSwitcher: showLanguageSwitcher } = useLanguage();
  const { status, enableStatusIndicator: showNetworkStatus } = useNetwork();

  const unreadByChannel = useChannelUnread();
  const { setTheme, setLanguage, setActiveChannel } = useActions();

  const channelStates = useMemo(() => {
    if (!isFetching || !activeConversationId) {
      return {};
    }

    const supportedChannels = new Set(metadata?.supportedChannels ?? []);

    return allowedChannels.reduce<
      Partial<Record<ChannelTypeEnum, ChannelStateDescriptor>>
    >((accumulator, channel) => {
      if (supportedChannels.has(channel)) {
        return accumulator;
      }

      accumulator[channel] = {
        disabled: true,
        tooltip: t('toolbar.channelFilter.unsupportedCurrentConversation', {
          channel: t(`toolbar.channel.${channel}`),
        }),
      };
      return accumulator;
    }, {});
  }, [
    activeConversationId,
    t,
    allowedChannels.reduce,
    metadata?.supportedChannels,
    isFetching,
  ]);

  return (
    <div className="flex items-center gap-4">
      {/* 渠道切换器 */}
      <ChannelFilter
        channels={allowedChannels}
        activeChannel={activeChannel}
        onChannelClick={setActiveChannel}
        channelStates={channelStates}
        unreadByChannel={unreadByChannel}
        showTooltip
      />

      {/* 网络状态 */}
      {showNetworkStatus && <NetworkStatus status={status} />}

      {/* 分隔线 */}
      {(allowedChannels.length > 1 || showNetworkStatus || extra) && (
        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
      )}

      {/* 语言和主题切换 */}
      <div className="flex gap-1">
        {showLanguageSwitcher && (
          <LanguageSwitcher value={code} onChange={setLanguage} />
        )}
        {showThemeSwitcher && (
          <ThemeSwitcher value={mode} onChange={setTheme} />
        )}
        {extra}
      </div>
    </div>
  );
});

TopbarTools.displayName = 'TopbarTools';
