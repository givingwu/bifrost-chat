import type { Meta } from 'storybook-react-rsbuild';
import {
  CHANNEL_BRAND_COLOR,
  ChannelIcon,
  EmailChannelIcon,
  RcsChannelIcon,
  SmsChannelIcon,
  ViberChannelIcon,
  WaAgentChannelIcon,
  WhatsAppChannelIcon,
} from '@/components';
import {
  AvailableChannels,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelIcon 公开图标组件 Story 文档
 */
const meta: Meta<typeof ChannelIcon> = {
  title: 'Toolbar/ChannelIcon',
  component: ChannelIcon,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      options: AvailableChannels,
      control: { type: 'select' },
      description: '渠道类型',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg'],
      description: '图标尺寸',
    },
  },
};

export default meta;

/**
 * 通用 ChannelIcon
 */
export const Default = () => (
  <div className="p-4 bg-muted rounded-lg text-text">
    <ChannelIcon channel={ChannelTypeEnum.WhatsApp} size="md" />
  </div>
);

/**
 * 所有渠道图标
 */
export const AllChannels = () => (
  <div className="flex gap-4 p-4 bg-muted rounded-lg flex-wrap">
    {AvailableChannels.map((channel) => (
      <div
        key={channel}
        className="flex items-center gap-2 text-sm text-text"
        style={{ color: CHANNEL_BRAND_COLOR[channel] }}
      >
        <ChannelIcon channel={channel} size="md" title={channel} />
        <span>{channel}</span>
      </div>
    ))}
  </div>
);

/**
 * 具名图标组件
 */
export const NamedIcons = () => (
  <div className="flex gap-4 p-4 bg-muted rounded-lg text-text">
    <SmsChannelIcon size="md" title="SMS" />
    <WhatsAppChannelIcon size="md" title="WhatsApp" />
    <WaAgentChannelIcon size="md" title="WaAgent" />
    <EmailChannelIcon size="md" title="Email" />
    <ViberChannelIcon size="md" title="Viber" />
    <RcsChannelIcon size="md" title="RCS" />
  </div>
);

/**
 * 自定义像素尺寸和颜色
 */
export const CustomSizeAndColor = () => (
  <div className="flex gap-4 p-4 bg-muted rounded-lg">
    <ChannelIcon
      channel={ChannelTypeEnum.RCS}
      size={40}
      title="RCS"
      className="text-cyan-500"
    />
    <EmailChannelIcon size={40} title="Email" className="text-orange-500" />
  </div>
);
