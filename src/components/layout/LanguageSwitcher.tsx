import {
  AvailableLanguageCodes,
  LanguageCode,
} from '@/interfaces/language.interface';

export interface LanguageSwitcherProps {
  value: LanguageCode;
  onChange?: (language: LanguageCode) => void;
}

const languageLabelMap: Record<LanguageCode, string> = {
  [LanguageCode.EnUS]: 'English',
  [LanguageCode.ZhCN]: '中文',
};

/**
 * LanguageSwitcher：语言切换。
 */
export const LanguageSwitcher = ({
  value,
  onChange,
}: LanguageSwitcherProps) => {
  return (
    <div
      data-component="language-switcher"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
    >
      {AvailableLanguageCodes.map((code) => {
        const active = value === code;

        return (
          <button
            key={code}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-text-muted hover:text-text'
            }`}
            onClick={() => onChange?.(code)}
          >
            {languageLabelMap[code]}
          </button>
        );
      })}
    </div>
  );
};
