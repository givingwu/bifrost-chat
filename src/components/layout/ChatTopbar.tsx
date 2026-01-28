import type { AgentStatus } from '@/interfaces/agent.interface';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { LanguageCode } from '@/interfaces/language.interface';
import type { NetworkStatus as NetworkStatusEnum } from '@/interfaces/network.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { ChannelToolsList } from '../toolbar/ChannelToolsList';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NetworkStatus } from './NetworkStatus';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface ChatTopbarProps {
  channels: ChannelType[];
  status?: AgentStatus;
  networkStatus: NetworkStatusEnum;
  themeMode: ThemeMode;
  language: LanguageCode;
  onChannelClick?: (type: ChannelType) => void;
  onThemeChange?: (mode: ThemeMode) => void;
  onLanguageChange?: (language: LanguageCode) => void;
}

/**
 * ChatTopbar：顶部工具栏（左侧渠道工具、右侧网络/主题状态）
 */
export const ChatTopbar = ({
  channels,
  status,
  networkStatus,
  themeMode,
  language,
  onChannelClick,
  onThemeChange,
  onLanguageChange,
}: ChatTopbarProps) => {
  return (
    <header
      data-component="chat-topbar"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-soft"
    >
      <ChannelToolsList
        channels={channels}
        status={status}
        onChannelClick={onChannelClick}
      />
      <div className="flex items-center gap-3">
        <NetworkStatus status={networkStatus} />
        <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        <LanguageSwitcher value={language} onChange={onLanguageChange} />
      </div>
    </header>
  );
};
