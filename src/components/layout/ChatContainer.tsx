import { type ReactNode, useCallback, useMemo } from 'react';
import { enUSMessages, zhCNMessages } from '@/index';
import {
  AvailableChannelTypes,
  type ChannelType,
} from '@/interfaces/channel.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';
import { ComposerToolbar } from '../composer/ComposerToolbar';
import { ConversationHeader } from '../conversation/ConversationHeader';
import { ConversationList } from '../conversation/ConversationList';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { ChannelFilter } from '../toolbar/ChannelFilter';
import { LanguageSwitcher } from '../toolbar/LanguageSwitcher';
import { NetworkStatus } from '../toolbar/NetworkStatus';
import { ThemeSwitcher } from '../toolbar/ThemeSwitcher';
import { ChatLayout, type ChatLayoutProps } from './ChatLayout';
import { ChatTopbar } from './ChatTopbar';

export interface ChatContainerProps extends Omit<ChatLayoutProps, 'topbar'> {
  topbar?: boolean;
  locale?: LanguageCode;
  children: ReactNode;
  onChannelClick?: (type: ChannelType) => void;
  onThemeChange?: (mode: ThemeMode) => void;
  onLanguageChange?: (language: LanguageCode) => void;
}

export const LanguageMessages = {
  [LanguageCode.EnUS]: enUSMessages,
  [LanguageCode.ZhCN]: zhCNMessages,
};

/**
 * ChatContainer：SDK 根容器（Provider + Store 绑定 + 顶部栏）。
 */
export const ChatContainer = ({
  topbar = true,
  locale,
  children,
  onChannelClick,
  onThemeChange,
  onLanguageChange,
}: ChatContainerProps) => {
  const { strategy, network, theme, language, actions, conversation } =
    useChatStore();

  const resolvedLanguage = useMemo(() => {
    if (locale) {
      return locale;
    }

    if (typeof navigator !== 'undefined') {
      const browserLanguage = navigator.language as LanguageCode;

      if (Object.values(LanguageCode).includes(browserLanguage)) {
        return browserLanguage;
      }
    }
    return LanguageCode.EnUS;
  }, [locale]);
  const finalMessages = useMemo(() => {
    return LanguageMessages[resolvedLanguage] || enUSMessages;
  }, [resolvedLanguage]);

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      actions.setTheme(mode);
      onThemeChange?.(mode);
    },
    [actions, onThemeChange],
  );
  const handleLanguageChange = useCallback(
    (code: LanguageCode) => {
      actions.setLanguage(code);
      onLanguageChange?.(code);
    },
    [actions, onLanguageChange],
  );
  const handleChannelClick = useCallback(
    (channel: ChannelType) => {
      actions.setActiveChannel(channel);
      onChannelClick?.(channel);
    },
    [actions, onChannelClick],
  );

  const conversationTitle = conversation.activeConversation?.user?.name;
  const conversationSubtitle = conversation.activeConversation?.channel;
  const conversationAvatar = conversation.activeConversation?.user?.avatarUrl;

  return (
    <I18nProvider
      data-component="chat-container"
      data-theme={theme.mode}
      data-language={resolvedLanguage}
      locale={resolvedLanguage}
      messages={finalMessages}
    >
      <ChatLayout
        className="max-w-[1400px]"
        topbar={
          topbar && (
            <ChatTopbar
              title={conversationTitle}
              subtitle={conversationSubtitle}
              avatarUrl={conversationAvatar}
              extra={
                <div className="flex items-center gap-2">
                  <NetworkStatus status={network.status} />

                  <div className="flex gap-1">
                    <LanguageSwitcher
                      value={language.code ?? resolvedLanguage}
                      onChange={handleLanguageChange}
                    />
                    <ThemeSwitcher
                      value={theme.mode}
                      onChange={handleThemeChange}
                    />
                  </div>
                </div>
              }
            />
          )
        }
        conversationPanel={
          <ConversationPanel
            header={
              <ConversationHeader title={finalMessages.title}>
                <ChannelFilter
                  channels={AvailableChannelTypes}
                  activeChannel={strategy.activeChannel}
                  onChannelClick={handleChannelClick}
                />
              </ConversationHeader>
            }
          >
            <ConversationList conversations={conversation.conversations} />
          </ConversationPanel>
        }
        composer={
          <ComposerToolbar
            channel={strategy.activeChannel}
            value={''}
            onChange={() => {}}
          />
        }
        // contextPanel={contextPanel}
      >
        {children}
      </ChatLayout>
    </I18nProvider>
  );
};
