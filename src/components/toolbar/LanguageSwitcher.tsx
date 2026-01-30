import { useCallback } from 'react';
import {
  AvailableLanguageCodes,
  LanguageCode,
} from '@/interfaces/language.interface';
import { CircularButton } from '../Button';

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
    <CircularButton
      data-component="language-switcher"
      aria-label={`Language: ${languageLabelMap[value]}`}
      onClick={nextLanguage}
      className={
        value === LanguageCode.EnUS
          ? 'text-text-muted hover:border-border hover:bg-muted/60 hover:text-text'
          : 'text-primary hover:border-primary/30 hover:bg-primary/10'
      }
    >
      <span className="text-sm font-semibold">{languageLabelMap[value]}</span>
    </CircularButton>
  );
};
