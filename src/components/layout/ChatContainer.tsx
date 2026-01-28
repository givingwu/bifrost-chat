import { type ReactNode, useCallback } from 'react';
import type { ChannelType } from '@/interfaces/channel.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';
import { ChatTopbar } from './ChatTopbar';

export interface ChatContainerProps {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
  channels: ChannelType[];
  onChannelClick?: (type: ChannelType) => void;
  onThemeChange?: (mode: ThemeMode) => void;
}

/**
 * ChatContainer：SDK 根容器（Provider + Store 绑定 + 顶部栏）。
 */
export const ChatContainer = ({
  locale,
  messages,
  children,
  channels,
  onChannelClick,
  onThemeChange,
}: ChatContainerProps) => {
  const { strategy, network, theme, actions } = useChatStore();
  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      actions.setTheme({ mode });
      onThemeChange?.(mode);
    },
    [actions, onThemeChange],
  );

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div
        data-component="omni-chat-container"
        data-theme={theme.mode}
        className="space-y-4"
      >
        <ChatTopbar
          channels={channels}
          status={strategy.agentStatus}
          networkStatus={network.status}
          themeMode={theme.mode}
          onChannelClick={onChannelClick}
          onThemeChange={handleThemeChange}
        />
        {children}
      </div>
    </I18nProvider>
  );
};
