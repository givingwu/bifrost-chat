import { useCallback } from 'react';
import {
  AvailableLanguageCodes,
  LanguageCode,
} from '@/interfaces/language.interface';

export interface LanguageSwitcherProps {
  value: LanguageCode;
  onChange?: (language: LanguageCode) => void;
}

const languageLabelMap: Record<LanguageCode, string> = {
  [LanguageCode.EnUS]: 'EN',
  [LanguageCode.ZhCN]: 'ZH',
};

/**
 * LanguageSwitcher：语言切换。
 */
export const LanguageSwitcher = ({
  value,
  onChange,
}: LanguageSwitcherProps) => {
  const nextLanguage = useCallback(() => {
    const currentIndex = AvailableLanguageCodes.indexOf(value);
    const nextIndex = (currentIndex + 1) % AvailableLanguageCodes.length;
    onChange?.(AvailableLanguageCodes[nextIndex]);
  }, [value, onChange]);

  return (
    <button
      type="button"
      data-component="language-switcher"
      aria-label={`Language: ${languageLabelMap[value]}`}
      onClick={nextLanguage}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        value === LanguageCode.EnUS
          ? 'text-text-muted hover:border-border hover:bg-muted/60 hover:text-text'
          : 'text-primary hover:border-primary/30 hover:bg-primary/10'
      }`}
    >
      <span className="w-4 text-center">{languageLabelMap[value]}</span>
    </button>
  );
};
