import { createContext, useContext, useMemo } from 'react';

export type I18nMessages = Record<string, unknown>;

export interface I18nContextValue {
  locale: string;
  messages: I18nMessages;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface I18nInstance {
  language: string;
  changeLanguage: (language: string) => void;
}

const I18nContext = createContext<
  (I18nContextValue & { onChangeLanguage?: (locale: string) => void }) | null
>(null);

export interface I18nProviderProps {
  /** 当前语言 */
  locale: string;
  /** 文案字典 */
  messages: I18nMessages;
  /** 子节点 */
  children: React.ReactNode;
  /** 切换语言回调 */
  onChangeLanguage?: (locale: string) => void;
}

/**
 * I18nProvider：轻量 i18n context。
 */
export const I18nProvider = ({
  locale,
  messages,
  children,
  onChangeLanguage,
}: I18nProviderProps) => {
  const value = useMemo<
    I18nContextValue & { onChangeLanguage?: (locale: string) => void }
  >(() => {
    const t = (key: string, options?: Record<string, unknown>) => {
      const parts = key.split('.');
      let current: unknown = messages;
      for (const part of parts) {
        if (!current || typeof current !== 'object') {
          return key;
        }
        current = (current as Record<string, unknown>)[part];
      }
      if (typeof current !== 'string') {
        return key;
      }
      if (!options) {
        return current;
      }
      return Object.entries(options).reduce((result, [token, value]) => {
        const safeValue = String(value);
        const regex = new RegExp(`{{\\s*${token}\\s*}}`, 'g');
        return result.replace(regex, safeValue);
      }, current);
    };

    return {
      locale,
      messages,
      t,
      onChangeLanguage,
    };
  }, [locale, messages, onChangeLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * useTranslation：react-i18next 风格 API（返回 { t, i18n }）
 */
export const useTranslation = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  return useMemo(() => {
    const i18n: I18nInstance = {
      language: context.locale,
      changeLanguage: (language: string) => {
        context.onChangeLanguage?.(language);
      },
    };

    return { t: context.t, i18n };
  }, [context]);
};
