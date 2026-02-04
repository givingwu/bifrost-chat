import type { Meta, StoryObj } from '@storybook/react';
import { DefaultChatLayout } from '@/components/layout/DefaultChatLayout';
import { ChannelType } from '@/interfaces/channel.interface';
import { LanguageCode } from '@/interfaces/language.interface';
import enUS from '@/locales/en-US.json';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';

/**
 * DefaultChatLayout 组件 Story 文档
 *
 * 展示默认聊天布局的各种用法：
 * - 完整布局
 * - 不同主题
 * - 不同语言
 */

const meta: Meta<typeof DefaultChatLayout> = {
  title: 'Layout/DefaultChatLayout',
  component: DefaultChatLayout,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DefaultChatLayout>;

/**
 * 基础示例 - 默认布局
 */
export const Default = () => {
  return (
    <I18nProvider locale="zh-CN" messages={zhCN}>
      <div className="w-full h-[600px]">
        <DefaultChatLayout />
      </div>
    </I18nProvider>
  );
};

/**
 * 不同主题 - 展示主题切换
 */
export const DifferentThemes = () => {
  return (
    <I18nProvider locale="zh-CN" messages={zhCN}>
      <div className="space-y-4">
        <div className="w-full h-[500px]" data-theme="light">
          <p className="text-xs text-text-muted mb-2">浅色主题</p>
          <DefaultChatLayout />
        </div>
        <div className="w-full h-[500px]" data-theme="dark">
          <p className="text-xs text-text-muted mb-2">深色主题</p>
          <DefaultChatLayout />
        </div>
      </div>
    </I18nProvider>
  );
};

/**
 * 完整示例 - 带容器
 */
export const WithContainer = () => {
  return (
    <I18nProvider locale="zh-CN" messages={zhCN}>
      <div className="w-full h-[600px]">
        <DefaultChatLayout />
      </div>
    </I18nProvider>
  );
};

/**
 * 英文版本
 */
export const English = () => {
  return (
    <I18nProvider locale="en-US" messages={enUS}>
      <div className="w-full h-[600px]">
        <DefaultChatLayout />
      </div>
    </I18nProvider>
  );
};
