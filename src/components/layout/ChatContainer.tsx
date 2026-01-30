import { type ReactNode, useCallback, useMemo } from 'react';
import type { ChannelType } from '@/interfaces/channel.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import type { ThemeMode } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';
import { ChatLayout } from './ChatLayout';
import { ChatTopbar } from './ChatTopbar';

export interface ChatContainerProps {
  locale?: LanguageCode;
  messages: Record<string, Record<string, unknown>>;
  children: ReactNode;
  channels: ChannelType[];
  /** 左侧会话列表区域 */
  conversationPanel?: ReactNode;
  /** 右侧上下文面板 */
  contextPanel?: ReactNode;
  /** 输入区组件 */
  composer?: ReactNode;
  onChannelClick?: (type: ChannelType) => void;
  onThemeChange?: (mode: ThemeMode) => void;
  onLanguageChange?: (language: LanguageCode) => void;
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
  onLanguageChange,
  conversationPanel,
  contextPanel,
  composer,
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
  const languageMessages = useMemo(() => {
    return messages[resolvedLanguage] ?? messages[LanguageCode.EnUS] ?? {};
  }, [messages, resolvedLanguage]);
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

  const conversationTitle = conversation.activeConversation?.user?.name;
  const conversationSubtitle = conversation.activeConversation?.channel;
  const conversationAvatar = conversation.activeConversation?.user?.avatarUrl;

  return (
    <I18nProvider
      data-component="chat-container"
      data-theme={theme.mode}
      data-language={resolvedLanguage}
      locale={resolvedLanguage}
      messages={languageMessages}
    >
      <ChatLayout
        topbar={
          <ChatTopbar
            channels={channels}
            status={strategy.agentStatus}
            networkStatus={network.status}
            themeMode={theme.mode}
            language={language.code ?? resolvedLanguage}
            onChannelClick={onChannelClick}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
            title={conversationTitle}
            subtitle={conversationSubtitle}
            avatarUrl={conversationAvatar}
          />
        }
        conversationPanel={conversationPanel}
        messages={children}
        composer={composer}
        contextPanel={contextPanel}
      />
    </I18nProvider>
  );
};
