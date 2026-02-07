import { type ReactNode, useEffect } from 'react';
import { cn } from '@/index';
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
  /** 子组件或 render props 函数 */
  children: ReactNode | ((store: ChatStoreState) => ReactNode);
}

/**
 * ChatContainer：SDK 根容器（Provider + Store 绑定）。
 *
 * @description
 * 提供统一的容器组件，整合 ConfigProvider、I18nProvider 和主题系统。
 * 作为桥梁，从 store 读取语言配置并传递给 I18nProvider。
 *
 * @example Headless 模式（完全自定义）
 * ```tsx
 * <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
 *   <ChatContainer>
 *     <MyCustomLayout />
 *   </ChatContainer>
 * </ConfigProvider>
 * ```
 *
 * @example Compound 模式（部分自定义）
 * ```tsx
 * <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
 *   <ChatContainer>
 *     <ChatLayout
 *       topbar={<CustomTopbar />}
 *       conversationPanel={<CustomConversationPanel />}
 *       composer={<CustomComposer />}
 *       profile={<CustomProfile />}
 *     >
 *       <CustomMessageList />
 *     </ChatLayout>
 *   </ChatContainer>
 * </ConfigProvider>
 * ```
 *
 * @example All-in-One 模式（开箱即用，通过特定组件自定义）
 * ```tsx
 * <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
 *   <ChatContainer>
 *     <DefaultChatLayout profile={<CustomProfile />} />
 *   </ChatContainer>
 * </ConfigProvider>
 * ```
 *
 * @example Render Props 模式（显式传递状态）
 * ```tsx
 * <ConfigProvider config={{ language: { code: LanguageCodeEnum.ZhCN } }}>
 *   <ChatContainer>
 *     {({ store, actions, strategy, network, theme, language, conversation, profile }) => (
 *       <CustomLayout
 *         store={store}
 *         actions={actions}
 *         strategy={strategy}
 *         network={network}
 *         theme={theme}
 *         language={language}
 *         conversation={conversation}
 *         profile={profile}
 *       />
 *     )}
 *   </ChatContainer>
 * </ConfigProvider>
 * ```
 */
export const ChatContainer = ({ children }: ChatContainerProps) => {
  const theme = useTheme();
  const store = useChatStore();
  const { code: languageCode, messages } = useLanguage();
  const { setLanguage, setSystemPrefersDark } = useActions();

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

  const resolvedThemeMode =
    theme.mode === ThemeModeEnum.System
      ? theme.systemPrefersDark
        ? ThemeModeEnum.Dark
        : ThemeModeEnum.Light
      : theme.mode;

  return (
    <I18nProvider
      locale={languageCode}
      messages={messages}
      onChangeLanguage={setLanguage}
    >
      <div
        data-component="chat-container"
        data-theme={theme.mode}
        data-theme-resolved={resolvedThemeMode}
        data-language={languageCode}
        className={cn(
          'w-full h-full',
          resolvedThemeMode === ThemeModeEnum.Dark ? 'dark' : '',
        )}
      >
        {typeof children === 'function'
          ? (children as (state: ChatStoreState) => ReactNode)(store)
          : children}
      </div>
    </I18nProvider>
  );
};
