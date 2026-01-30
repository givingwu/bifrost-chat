import type { AgentStatus } from '@/interfaces/agent.interface';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { LanguageCode } from '@/interfaces/language.interface';
import type { NetworkStatus as NetworkStatusEnum } from '@/interfaces/network.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { cn } from '@/utils/class.util';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { NetworkStatus } from '../toolbar/NetworkStatus';
import { ThemeSwitcher } from '../toolbar/ThemeSwitcher';

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
        'flex flex-wrap items-center justify-between gap-4',
        'border-b border-gray-200/50 dark:border-white/10',
        'flex items-center justify-between px-6 py-3',
        'shadow-soft dark:bg-gray-900/50 bg-card/80 backdrop-blur-md z-10',
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

      <ChannelFilter
        channels={channels}
        status={status}
        onChannelClick={onChannelClick}
      />

      <div className="flex items-center gap-2">
        <NetworkStatus status={networkStatus} />

        <div className="flex gap-1">
          <LanguageSwitcher value={language} onChange={onLanguageChange} />
          <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
};
