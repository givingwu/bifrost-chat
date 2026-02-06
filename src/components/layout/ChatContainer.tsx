import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import { enUSMessages, zhCNMessages } from '@/index';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import {
  type ChatStoreState,
  useActions,
  useChatStore,
  useLanguage,
  useTheme,
} from '@/store';

export interface ChatContainerProps {
  /** 语言代码 */
  locale?: LanguageCodeEnum;
  /** 子组件或 render props 函数 */
  children: ReactNode | ((store: ChatStoreState) => ReactNode);
}

export const LanguageMessages = {
  [LanguageCodeEnum.EnUS]: enUSMessages,
  [LanguageCodeEnum.ZhCN]: zhCNMessages,
};

/**
 * ChatContainer：SDK 根容器（Provider + Store 绑定）。
 *
 * @example Headless 模式（完全自定义）
 * <ChatContainer locale="zh-CN">
 *   <MyCustomLayout />
 * </ChatContainer>
 *
 * @example Compound 模式（部分自定义）
 * <ChatContainer locale="zh-CN">
 *   <ChatLayout
 *     topbar={<CustomTopbar />}
 *     conversationPanel={<CustomConversationPanel />}
 *     composer={<CustomComposer />}
 *     contextPanel={<CustomProfile />}
 *   >
 *     <CustomMessageList />
 *   </ChatLayout>
 * </ChatContainer>
 *
 * @example All-in-One 模式（开箱即用，通过特定组件自定义）
 * <ChatContainer locale="zh-CN">
 *   <DefaultChatLayout contextPanel={<CustomProfile />} />
 * </ChatContainer>
 *
 * @example Render Props 模式（显式传递状态）
 * <ChatContainer locale="zh-CN">
 *   {({ store, actions, strategy, network, theme, language, conversation, profile }) => (
 *     <CustomLayout
 *       store={store}
 *       actions={actions}
 *       strategy={strategy}
 *       network={network}
 *       theme={theme}
 *       language={language}
 *       conversation={conversation}
 *       profile={profile}
 *     />
 *   )}
 * </ChatContainer>
 */
export const ChatContainer = ({ locale, children }: ChatContainerProps) => {
  const theme = useTheme();
  const store = useChatStore();
  const { code: languageCode } = useLanguage();
  const { setLanguage, setSystemPrefersDark } = useActions();

  const handleLanguageChange = useCallback(
    (newLocale: string) => {
      setLanguage(newLocale as LanguageCodeEnum);
    },
    [setLanguage],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <Ignore locale changes>
  useEffect(() => {
    if (locale) {
      setLanguage(locale);
    }
  }, [setLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setSystemPrefersDark]);

  const finalMessages = useMemo(() => {
    return LanguageMessages[languageCode] || enUSMessages;
  }, [languageCode]);

  const resolvedThemeMode =
    theme.mode === ThemeModeEnum.System
      ? theme.systemPrefersDark
        ? ThemeModeEnum.Dark
        : ThemeModeEnum.Light
      : theme.mode;

  return (
    <I18nProvider
      locale={languageCode}
      messages={finalMessages}
      onChangeLanguage={handleLanguageChange}
    >
      <div
        data-component="chat-container"
        data-theme={theme.mode}
        data-theme-resolved={resolvedThemeMode}
        data-language={languageCode}
        className={resolvedThemeMode === ThemeModeEnum.Dark ? 'dark' : ''}
      >
        {typeof children === 'function'
          ? (children as (state: ChatStoreState) => ReactNode)(store)
          : children}
      </div>
    </I18nProvider>
  );
};
