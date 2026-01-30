import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeMode } from '@/interfaces/theme.interface';

export interface ThemeSwitcherProps {
  value: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
}

const themeOrder = [ThemeMode.System, ThemeMode.Light, ThemeMode.Dark];

/**
 * To switch between light, dark, and system themes.
 */
export const ThemeSwitcher = ({ value, onChange }: ThemeSwitcherProps) => {
  const nextTheme = () => {
    const currentIndex = themeOrder.indexOf(value);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    onChange?.(themeOrder[nextIndex]);
  };

  const iconMap = {
    [ThemeMode.System]: <Monitor className="h-5 w-5" />,
    [ThemeMode.Light]: <Sun className="h-5 w-5" />,
    [ThemeMode.Dark]: <Moon className="h-5 w-5" />,
  } satisfies Record<ThemeMode, React.ReactNode>;

  const labelMap = {
    [ThemeMode.System]: 'System',
    [ThemeMode.Light]: 'Light',
    [ThemeMode.Dark]: 'Dark',
  } satisfies Record<ThemeMode, string>;

  return (
    <button
      type="button"
      data-component="theme-switcher"
      aria-label={`Theme: ${labelMap[value]}`}
      onClick={nextTheme}
      className={`rounded-full p-2 text-text-muted transition-colors hover:bg-muted/60 hover:text-text ${
        value !== ThemeMode.System
          ? 'text-primary hover:border-primary/30 hover:bg-primary/10'
          : ''
      }`}
    >
      {iconMap[value]}
    </button>
  );
};
