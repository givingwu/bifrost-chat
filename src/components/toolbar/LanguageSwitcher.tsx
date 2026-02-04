import { useCallback } from 'react';
import {
  AvailableLanguageCodes,
  LanguageCodeEnum,
} from '@/interfaces/language.interface';
import { CircularButton } from '../Button';

export interface LanguageSwitcherProps {
  value: LanguageCodeEnum;
  onChange?: (language: LanguageCodeEnum) => void;
}

const languageLabelMap: Record<LanguageCodeEnum, string> = {
  [LanguageCodeEnum.EnUS]: 'EN',
  [LanguageCodeEnum.ZhCN]: 'ZH',
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
        value === LanguageCodeEnum.EnUS
          ? 'text-text-muted hover:border-border hover:bg-muted/60 hover:text-text'
          : 'text-primary hover:border-primary/30 hover:bg-primary/10'
      }
    >
      <span className="text-sm font-semibold">{languageLabelMap[value]}</span>
    </CircularButton>
  );
};
