import { ThemeMode } from '@/interfaces/theme.interface';

export interface ThemeSwitcherProps {
  value: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
}

const options: Array<{ label: string; value: ThemeMode }> = [
  { label: 'System', value: ThemeMode.System },
  { label: 'Light', value: ThemeMode.Light },
  { label: 'Dark', value: ThemeMode.Dark },
];

/**
 * To switch between light, dark, and system themes.
 */
export const ThemeSwitcher = ({ value, onChange }: ThemeSwitcherProps) => {
  return (
    <div
      data-component="theme-switcher"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-text-muted hover:text-text'
            }`}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
