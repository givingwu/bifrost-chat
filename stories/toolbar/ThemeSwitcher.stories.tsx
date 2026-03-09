import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ThemeSwitcher } from '@/components/toolbar/ThemeSwitcher';
import { ThemeModeEnum } from '@/interfaces/theme.interface';
import '@/styles/theme.css';

/**
 * ThemeSwitcher 组件 Story 文档
 *
 * 展示主题切换器的各种用法：
 * - 不同主题模式
 * - 切换交互
 */

const meta: Meta<typeof ThemeSwitcher> = {
  title: 'Toolbar/ThemeSwitcher',
  component: ThemeSwitcher,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: [ThemeModeEnum.Light, ThemeModeEnum.Dark, ThemeModeEnum.System],
      description: '当前主题',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeSwitcher>;

/**
 * 基础示例 - 系统主题
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ThemeSwitcher
        value={ThemeModeEnum.System}
        onChange={(mode) => console.log('Theme changed:', mode)}
      />
    </div>
  );
};

/**
 * 所有主题 - 展示所有可用主题
 */
export const AllThemes = () => {
  const themes = [
    { mode: ThemeModeEnum.Light, name: '浅色模式', icon: '☀️' },
    { mode: ThemeModeEnum.Dark, name: '深色模式', icon: '🌙' },
    { mode: ThemeModeEnum.System, name: '跟随系统', icon: '💻' },
  ];

  return (
    <div className="space-y-3">
      {themes.map((theme) => (
        <div
          key={theme.mode}
          className="flex items-center gap-3 p-4 bg-muted rounded-lg"
        >
          <span className="text-2xl">{theme.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{theme.name}</p>
            <p className="text-xs text-text-muted">{theme.mode}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 交互示例 - 切换主题
 */
export const Interactive = () => {
  const [theme, setTheme] = useState(ThemeModeEnum.System);

  const themeNames = {
    [ThemeModeEnum.Light]: '浅色模式',
    [ThemeModeEnum.Dark]: '深色模式',
    [ThemeModeEnum.System]: '跟随系统',
  };

  const themeIcons = {
    [ThemeModeEnum.Light]: '☀️',
    [ThemeModeEnum.Dark]: '🌙',
    [ThemeModeEnum.System]: '💻',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-soft">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{themeIcons[theme]}</span>
          <span className="text-sm font-medium">{themeNames[theme]}</span>
        </div>
        <ThemeSwitcher value={theme} onChange={setTheme} />
      </div>
      <p className="text-xs text-text-muted">
        当前主题: {themeNames[theme]} ({theme})
      </p>
    </div>
  );
};

/**
 * 在工具栏中使用 - 展示实际应用场景
 */
export const InToolbar = () => {
  const [theme, setTheme] = useState(ThemeModeEnum.Light);

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">主题设置</h3>
        <ThemeSwitcher value={theme} onChange={setTheme} />
      </div>
    </div>
  );
};

/**
 * 主题预览 - 展示不同主题效果
 */
export const ThemePreview = () => {
  const [theme, setTheme] = useState(ThemeModeEnum.Light);

  const themeConfigs = {
    [ThemeModeEnum.Light]: {
      bg: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
    },
    [ThemeModeEnum.Dark]: {
      bg: 'bg-gray-900',
      text: 'text-white',
      border: 'border-gray-700',
    },
    [ThemeModeEnum.System]: {
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      border: 'border-gray-300',
    },
  };

  const config = themeConfigs[theme];

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-lg border ${config.bg} ${config.text} ${config.border}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">主题预览</h3>
          <ThemeSwitcher value={theme} onChange={setTheme} />
        </div>
        <p className="text-sm mb-2">这是一段示例文本</p>
        <button
          type="button"
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
        >
          示例按钮
        </button>
      </div>
    </div>
  );
};
