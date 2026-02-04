import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback } from 'react';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import { CircularButton } from '../Button';

export interface ThemeSwitcherProps {
  value: ThemeModeEnum;
  onChange?: (mode: ThemeModeEnum) => void;
}

const themeOrder = [
  ThemeModeEnum.System,
  ThemeModeEnum.Light,
  ThemeModeEnum.Dark,
];

/**
 * To switch between light, dark, and system themes.
 */
export const ThemeSwitcher = ({ value, onChange }: ThemeSwitcherProps) => {
  const iconMap = {
    [ThemeModeEnum.System]: <Monitor className="h-4 w-4" />,
    [ThemeModeEnum.Light]: <Sun className="h-4 w-4" />,
    [ThemeModeEnum.Dark]: <Moon className="h-4 w-4" />,
  } satisfies Record<ThemeModeEnum, React.ReactNode>;

  const labelMap = {
    [ThemeModeEnum.System]: 'System',
    [ThemeModeEnum.Light]: 'Light',
    [ThemeModeEnum.Dark]: 'Dark',
  } satisfies Record<ThemeModeEnum, string>;

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
        value !== ThemeModeEnum.System
          ? 'text-primary hover:border-primary/30 hover:bg-primary/10'
          : ''
      }
    >
      {iconMap[value]}
    </CircularButton>
  );
};
