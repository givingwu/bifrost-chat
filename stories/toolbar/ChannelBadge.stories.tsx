import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelBadge } from '@/components/toolbar/ChannelBadge';
import {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelBadge 组件 Story 文档
 */
const meta: Meta<typeof ChannelBadge> = {
  title: 'Toolbar/ChannelBadge',
  component: ChannelBadge,
  tags: ['autodocs'],
  argTypes: {
    type: {
      options: AvailableChannelTypes,
      control: { type: 'select' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelBadge>;

export const WhatsApp = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelTypeEnum.WhatsApp} />
    </div>
  );
};

export const SMS = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelTypeEnum.SMS} />
    </div>
  );
};

export const Email = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelBadge type={ChannelTypeEnum.Email} />
    </div>
  );
};
