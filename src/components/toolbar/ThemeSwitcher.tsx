import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback } from 'react';
import { ThemeMode } from '@/interfaces/theme.interface';
import { CircularButton } from '../Button';

export interface ThemeSwitcherProps {
  value: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
}

const themeOrder = [ThemeMode.System, ThemeMode.Light, ThemeMode.Dark];

/**
 * To switch between light, dark, and system themes.
 */
export const ThemeSwitcher = ({ value, onChange }: ThemeSwitcherProps) => {
  const iconMap = {
    [ThemeMode.System]: <Monitor className="h-4 w-4" />,
    [ThemeMode.Light]: <Sun className="h-4 w-4" />,
    [ThemeMode.Dark]: <Moon className="h-4 w-4" />,
  } satisfies Record<ThemeMode, React.ReactNode>;

  const labelMap = {
    [ThemeMode.System]: 'System',
    [ThemeMode.Light]: 'Light',
    [ThemeMode.Dark]: 'Dark',
  } satisfies Record<ThemeMode, string>;

  const nextTheme = useCallback(() => {
    const currentIndex = themeOrder.indexOf(value);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    onChange?.(themeOrder[nextIndex]);
  }, [value, onChange]);

  return (
    <CircularButton
      data-component="theme-switcher"
      aria-label={`Theme: ${labelMap[value]}`}
      onClick={nextTheme}
      className={
        value !== ThemeMode.System
          ? 'text-primary hover:border-primary/30 hover:bg-primary/10'
          : ''
      }
    >
      {iconMap[value]}
    </CircularButton>
  );
};
