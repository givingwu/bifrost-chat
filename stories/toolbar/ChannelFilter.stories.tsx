import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

const meta: Meta<typeof ChannelFilter> = {
  title: 'Toolbar/ChannelFilter',
  component: ChannelFilter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ChannelFilter>;

/**
 * 基础示例：单渠道
 */
export const SingleChannel: Story = {
  args: {
    channels: [ChannelTypeEnum.SMS],
    activeChannel: ChannelTypeEnum.SMS,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * 多渠道示例
 */
export const MultipleChannels: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * 全部渠道
 */
export const AllChannels: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
      ChannelTypeEnum.Viber,
      ChannelTypeEnum.IVR,
    ],
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * 非紧凑模式（显示文字）
 */
export const NonCompact: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: ChannelTypeEnum.SMS,
    onChannelClick: () => {},
    compact: false,
    showTooltip: true,
  },
};

/**
 * 无工具提示
 */
export const WithoutTooltip: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: false,
  },
};

/**
 * 暗色模式
 */
export const DarkMode: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: ChannelTypeEnum.Email,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

/**
 * 无激活渠道
 */
export const NoActiveChannel: Story = {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.Email,
    ],
    activeChannel: undefined,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};
