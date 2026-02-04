import type { Meta, StoryObj } from '@storybook/react';
import { ComposerHint } from '@/components/composer/ComposerHint';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ComposerHint 组件 Story 文档
 *
 * 展示输入提示组件的各种用法：
 * - 不同渠道的提示信息
 * - WhatsApp 渠道的安全提示
 */

const meta: Meta<typeof ComposerHint> = {
  title: 'Composer/ComposerHint',
  component: ComposerHint,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComposerHint>;

/**
 * WhatsApp 渠道
 */
export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerHint channel={ChannelTypeEnum.WhatsApp} />
    </div>
  );
};

/**
 * SMS 渠道
 */
export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerHint channel={ChannelTypeEnum.SMS} />
    </div>
  );
};

/**
 * Email 渠道
 */
export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerHint channel={ChannelTypeEnum.Email} />
    </div>
  );
};

/**
 * 无渠道
 */
export const NoChannel = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerHint />
    </div>
  );
};

/**
 * 在输入框下方使用
 */
export const InInputArea = () => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
      <input
        type="text"
        placeholder="输入消息..."
        className="px-3 py-2 text-sm border border-border rounded-md bg-card text-text"
      />
      <ComposerHint channel={ChannelTypeEnum.WhatsApp} />
    </div>
  );
};
