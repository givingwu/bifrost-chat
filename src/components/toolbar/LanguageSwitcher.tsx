import { useCallback } from 'react';
import {
  AvailableLanguageCodes,
  LanguageCodeEnum,
} from '@/interfaces/language.interface';
import { useTranslation } from '@/providers/I18n.provider';
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
  const { t } = useTranslation();
  const nextLanguage = useCallback(() => {
    const currentIndex = AvailableLanguageCodes.indexOf(value);
    const nextIndex = (currentIndex + 1) % AvailableLanguageCodes.length;
    onChange?.(AvailableLanguageCodes[nextIndex]);
  }, [value, onChange]);

  return (
    <CircularButton
      data-component="language-switcher"
      aria-label={t('toolbar.language.ariaLabel', {
        code: languageLabelMap[value],
      })}
      onClick={nextLanguage}
      className={
        value === LanguageCodeEnum.EnUS
          ? 'text-gray-400 dark:text-gray-500 hover:border-border hover:bg-muted/60 hover:text-text'
          : 'text-primary hover:border-primary/30 hover:bg-primary/10'
      }
    >
      <span className="text-sm font-semibold">{languageLabelMap[value]}</span>
    </CircularButton>
  );
};
