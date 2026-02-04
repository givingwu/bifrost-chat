import type { Meta, StoryObj } from '@storybook/react';
import { ChannelBadge } from '@/components/toolbar/ChannelBadge';
import { ChannelType } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelBadge 组件 Story 文档
 */

const meta: Meta<typeof ChannelBadge> = {
  title: 'Toolbar/ChannelBadge',
  component: ChannelBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChannelBadge>;

export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelType.WhatsApp} />
    </div>
  );
};

export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelType.SMS} />
    </div>
  );
};

export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelType.Email} />
    </div>
  );
};
