import type { Meta, StoryObj } from '@storybook/react';
import { ComposerToolbar } from '@/components/composer/ComposerToolbar';
import {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import { LanguageCodeEnum } from '@/interfaces/language.interface';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
import '@/styles/theme.css';

/**
 * ComposerToolbar 组件 Story 文档
 *
 * 展示完整的输入工具栏的各种用法：
 * - 不同渠道的工具栏
 * - 附件上传
 * - 表情选择
 * - 模板选择
 */
const meta: Meta<typeof ComposerToolbar> = {
  title: 'Composer/ComposerToolbar',
  component: ComposerToolbar,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      defaultValue: ChannelTypeEnum.WhatsApp,
      control: { type: 'select' },
      options: AvailableChannelTypes,
    },
    onSend: { action: 'send' },
    onAttachmentSelect: { action: 'attachmentSelect' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    onEmojiClick: { action: 'emojiClick' },
    maxLength: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof ComposerToolbar>;

/**
 * WhatsApp 渠道
 */
export const WhatsApp = () => {
  return (
    <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCN}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.WhatsApp}
          onSend={(content) => console.log('Send:', content)}
          onAttachmentSelect={(files) => console.log('Files:', files)}
        />
      </div>
    </I18nProvider>
  );
};

/**
 * SMS 渠道
 */
export const SMS = () => {
  return (
    <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCN}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.SMS}
          onSend={(content) => console.log('Send:', content)}
        />
      </div>
    </I18nProvider>
  );
};

/**
 * Email 渠道
 */
export const Email = () => {
  return (
    <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCN}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.Email}
          onSend={(content) => console.log('Send:', content)}
        />
      </div>
    </I18nProvider>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <I18nProvider locale={LanguageCodeEnum.ZhCN} messages={zhCN}>
      <div className="p-4 bg-muted rounded-lg">
        <ComposerToolbar
          channel={ChannelTypeEnum.WhatsApp}
          disabled
          onSend={(content) => console.log('Send:', content)}
        />
      </div>
    </I18nProvider>
  );
};
