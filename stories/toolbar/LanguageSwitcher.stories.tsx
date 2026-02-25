import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { LanguageSwitcher } from '@/components/toolbar/LanguageSwitcher';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import '@/styles/theme.css';

/**
 * LanguageSwitcher 组件 Story 文档
 *
 * 展示语言切换器的各种用法：
 * - 不同语言
 * - 切换交互
 */

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Toolbar/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: [LanguageCodeEnum.EnUS, LanguageCodeEnum.ZhCN],
      description: '当前语言',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

/**
 * 基础示例 - 英文
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <LanguageSwitcher
        value={LanguageCodeEnum.EnUS}
        onChange={(lang) => console.log('Language changed:', lang)}
      />
    </div>
  );
};

/**
 * 所有语言 - 展示所有可用语言
 */
export const AllLanguages = () => {
  const languages = [
    { code: LanguageCodeEnum.EnUS, name: 'English', flag: '🇺🇸' },
    { code: LanguageCodeEnum.ZhCN, name: '简体中文', flag: '🇨🇳' },
  ];

  return (
    <div className="space-y-3">
      {languages.map((lang) => (
        <div
          key={lang.code}
          className="flex items-center gap-3 p-4 bg-muted rounded-lg"
        >
          <span className="text-2xl">{lang.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{lang.name}</p>
            <p className="text-xs text-text-muted">{lang.code}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 交互示例 - 切换语言
 */
export const Interactive = () => {
  const [language, setLanguage] = useState(LanguageCodeEnum.EnUS);

  const languageNames = {
    [LanguageCodeEnum.EnUS]: 'English',
    [LanguageCodeEnum.ZhCN]: '简体中文',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-soft">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {language === LanguageCodeEnum.EnUS ? '🇺🇸' : '🇨🇳'}
          </span>
          <span className="text-sm font-medium">{languageNames[language]}</span>
        </div>
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </div>
      <p className="text-xs text-text-muted">
        当前语言: {languageNames[language]} ({language})
      </p>
    </div>
  );
};

/**
 * 在工具栏中使用 - 展示实际应用场景
 */
export const InToolbar = () => {
  const [language, setLanguage] = useState(LanguageCodeEnum.ZhCN);

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">语言设置</h3>
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </div>
    </div>
  );
};
