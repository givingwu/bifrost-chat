import { type ReactNode, useEffect, useRef } from 'react';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import {
  type ChatStoreState,
  useActions,
  useChatStore,
  useLanguage,
  useTheme,
} from '@/store';
import { cn } from '@/utils/class.util';

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

  // 用 ref 保持最新函数引用，避免 useEffect 因函数引用变化而死循环
  const setSystemPrefersDarkRef = useRef(setSystemPrefersDark);
  setSystemPrefersDarkRef.current = setSystemPrefersDark;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDarkRef.current(event.matches);
    };

    setSystemPrefersDarkRef.current(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只挂载一次，通过 ref 访问最新函数

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
