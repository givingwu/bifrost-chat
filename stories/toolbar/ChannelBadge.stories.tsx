import type { Meta } from 'storybook-react-rsbuild';
import { ChannelBadge } from '@/components/toolbar/ChannelBadge';
import {
  AvailableChannels,
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
      options: AvailableChannels,
      control: { type: 'select' },
    },
  },
};

export default meta;

export const WhatsApp = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelBadge type={ChannelTypeEnum.WhatsApp} />
  </div>
);

export const SMS = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelBadge type={ChannelTypeEnum.SMS} />
  </div>
);

export const Email = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelBadge type={ChannelTypeEnum.Email} />
  </div>
);

export const Viber = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelBadge type={ChannelTypeEnum.Viber} />
  </div>
);

export const RCS = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelBadge type={ChannelTypeEnum.RCS} />
  </div>
);

/**
 * 所有渠道一览
 */
export const AllChannels = () => (
  <div className="flex gap-3 p-4 bg-muted rounded-lg flex-wrap">
    {AvailableChannels.map((channel) => (
      <ChannelBadge key={channel} type={channel} />
    ))}
  </div>
);
