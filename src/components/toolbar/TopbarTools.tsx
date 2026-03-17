import { memo, type ReactNode } from 'react';
import { useChannelSwitcher, useChannelUnread } from '@/hooks';
import { useActions, useLanguage, useNetwork, useTheme } from '@/store';
import { ChannelFilter } from './ChannelFilter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NetworkStatus } from './NetworkStatus';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface ITopbarTools {
  extra?: ReactNode;
}

/**
 * TopbarTools：会话顶部栏右侧工具集合。
 */
export const TopbarTools = memo(({ extra = null }: ITopbarTools) => {
  const { status, enableStatusIndicator: showNetworkStatus } = useNetwork();
  const { channels, activeChannel, channelStates, handleChannelChange } =
    useChannelSwitcher();
  const { mode, enableSwitcher: showThemeSwitcher } = useTheme();
  const { code, enableSwitcher: showLanguageSwitcher } = useLanguage();
  const { setTheme, setLanguage } = useActions();
  const unreadByChannel = useChannelUnread(channels);

  return (
    <div className="flex items-center gap-4">
      {/* 渠道切换器 */}
      <ChannelFilter
        channels={channels}
        activeChannel={activeChannel}
        onChannelClick={(channel) => {
          void handleChannelChange(channel);
        }}
        channelStates={channelStates}
        unreadByChannel={unreadByChannel}
        showTooltip
      />

      {/* 网络状态 */}
      {showNetworkStatus && <NetworkStatus status={status} />}

      {/* 分隔线 */}
      {(channels.length > 1 || showNetworkStatus || extra) && (
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
