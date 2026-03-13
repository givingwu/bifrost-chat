import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import { CHANNEL_BRAND_COLOR } from '@/hooks/use-channel-icon.hook';
import {
  AvailableChannels,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';

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
 * 基础示例：单渠道（无指示器）
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
 * 全部渠道（5 个）
 */
export const AllChannels: Story = {
  args: {
    channels: AvailableChannels,
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * 品牌色展示 — 每个渠道的 active 背景色各不相同
 *
 * 点击按钮可切换 activeChannel，观察各渠道品牌色。
 */
export const BrandColors = () => (
  <div className="flex flex-col gap-4 items-start">
    {AvailableChannels.map((channel) => (
      <div key={channel} className="flex items-center gap-3">
        <ChannelFilter
          channels={AvailableChannels}
          activeChannel={channel}
          onChannelClick={() => {}}
          compact
          showTooltip={false}
        />
        <span className="text-xs text-gray-600 font-mono">
          {channel} — {CHANNEL_BRAND_COLOR[channel]}
        </span>
        <span
          className="inline-block w-4 h-4 rounded-full"
          style={{ backgroundColor: CHANNEL_BRAND_COLOR[channel] }}
        />
      </div>
    ))}
  </div>
);

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
    unreadByChannel: {
      [ChannelTypeEnum.SMS]: 9,
      [ChannelTypeEnum.WhatsApp]: 99,
      [ChannelTypeEnum.Email]: 999,
    },
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
    channels: AvailableChannels,
    activeChannel: ChannelTypeEnum.Viber,
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

/**
 * 渠道未读 Badge 示例
 */
export const WithUnreadBadge: Story = {
  args: {
    channels: AvailableChannels,
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
    unreadByChannel: {
      [ChannelTypeEnum.SMS]: 3,
      [ChannelTypeEnum.WhatsApp]: 10,
      [ChannelTypeEnum.Viber]: 99,
    },
  },
};

/**
 * 不传 unreadByChannel → 不显示 Badge
 */
export const WithoutUnreadBadge: Story = {
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
 * 大量未读（测试 99+ 截断）
 */
export const UnreadOverflow: Story = {
  args: {
    channels: [ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp],
    activeChannel: ChannelTypeEnum.SMS,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
    unreadByChannel: {
      [ChannelTypeEnum.SMS]: 120, // → 99+
      [ChannelTypeEnum.WhatsApp]: 5,
    },
  },
};
