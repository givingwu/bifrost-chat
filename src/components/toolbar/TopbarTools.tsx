import type { ReactNode } from 'react';
import { useActions, useLanguage, useNetwork, useTheme } from '@/store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NetworkStatus } from './NetworkStatus';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface ITopbarTools {
  extra?: ReactNode;
}

/**
 * TopbarTools：会话顶部栏右侧工具集合。
 */
export const TopbarTools = ({ extra }: ITopbarTools) => {
  const { status } = useNetwork();
  const { mode } = useTheme();
  const { code } = useLanguage();
  const { setTheme, setLanguage } = useActions();

  return (
    <div className="flex items-center gap-4">
      <NetworkStatus status={status} />

      <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>

      <div className="flex gap-1">
        <LanguageSwitcher value={code} onChange={setLanguage} />
        <ThemeSwitcher value={mode} onChange={setTheme} />
        {extra}
      </div>
    </div>
  );
};
