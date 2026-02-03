import { type ReactNode, useMemo } from 'react';
import { enUSMessages, zhCNMessages } from '@/index';
import { LanguageCode } from '@/interfaces/language.interface';
import { I18nProvider } from '@/providers/I18n.provider';
import { useChatStore } from '@/store';

export interface ChatContainerProps {
  /** 语言代码 */
  locale?: LanguageCode;
  /** 子组件或 render props 函数 */
  children: ReactNode | ((store: ReturnType<typeof useChatStore>) => ReactNode);
}

export const LanguageMessages = {
  [LanguageCode.EnUS]: enUSMessages,
  [LanguageCode.ZhCN]: zhCNMessages,
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
 *     contextPanel={<CustomContextPanel />}
 *   >
 *     <CustomMessageList />
 *   </ChatLayout>
 * </ChatContainer>
 *
 * @example All-in-One 模式（开箱即用，通过特定组件自定义）
 * <ChatContainer locale="zh-CN">
 *   <DefaultChatLayout contextPanel={<CustomContextPanel />} />
 * </ChatContainer>
 *
 * @example Render Props 模式（显式传递状态）
 * <ChatContainer locale="zh-CN">
 *   {({ store, actions, strategy, network, theme, language, conversation, context }) => (
 *     <CustomLayout
 *       store={store}
 *       actions={actions}
 *       strategy={strategy}
 *       network={network}
 *       theme={theme}
 *       language={language}
 *       conversation={conversation}
 *       context={context}
 *     />
 *   )}
 * </ChatContainer>
 */
export const ChatContainer = ({ locale, children }: ChatContainerProps) => {
  const store = useChatStore();
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

  return (
    <I18nProvider
      data-component="chat-container"
      data-theme={store.theme.mode}
      data-language={resolvedLanguage}
      locale={resolvedLanguage}
      messages={finalMessages}
    >
      {typeof children === 'function'
        ? (children as (store: ReturnType<typeof useChatStore>) => ReactNode)(
            store,
          )
        : children}
    </I18nProvider>
  );
};
