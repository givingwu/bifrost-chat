import type { AgentStatus } from '@/interfaces/agent.interface';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { LanguageCode } from '@/interfaces/language.interface';
import type { NetworkStatus as NetworkStatusEnum } from '@/interfaces/network.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { cn } from '@/utils/class.util';
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
  /** 当前会话标题 */
  title?: string;
  /** 当前会话副标题 */
  subtitle?: string;
  /** 会话头像 */
  avatarUrl?: string;
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
  title,
  subtitle,
  avatarUrl,
}: ChatTopbarProps) => {
  return (
    <header
      data-component="chat-topbar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-2xl',
        'border border-border bg-card/80 px-6 py-3 shadow-soft backdrop-blur-md',
      )}
    >
      <div className="flex items-center gap-3">
        {avatarUrl && (
          <div className="relative">
            <img
              src={avatarUrl}
              alt={title ?? 'conversation'}
              className="h-10 w-10 rounded-full object-cover shadow-soft"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-text">
            {title ?? 'Conversation'}
          </div>
          {subtitle && (
            <div className="text-xs text-text-muted">{subtitle}</div>
          )}
        </div>
      </div>
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
