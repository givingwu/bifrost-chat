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
  onChannelClick?: (type: ChannelType) => void;
  onThemeChange?: (mode: ThemeMode) => void;
  onLanguageChange?: (language: LanguageCode) => void;
  /** 左侧会话列表区域 */
  conversationList?: ReactNode;
  /** 右侧上下文面板 */
  contextPanel?: ReactNode;
  /** 输入区组件 */
  composer?: ReactNode;
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
  conversationList,
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
    <I18nProvider locale={resolvedLanguage} messages={languageMessages}>
      <div
        data-component="chat-container"
        data-theme={theme.mode}
        data-language={resolvedLanguage}
        className="flex h-screen items-center justify-center bg-background p-6"
      >
        <div className="flex w-full max-w-[1400px] flex-col gap-4">
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
          <ChatLayout
            conversation={conversationList}
            messages={children}
            composer={composer ?? <div />}
            contextPanel={contextPanel}
          />
        </div>
      </div>
    </I18nProvider>
  );
};
