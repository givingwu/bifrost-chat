import type { Meta } from 'storybook-react-rsbuild';
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

/**
 * 基础示例：单渠道（无指示器）
 */
export const SingleChannel= {
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
export const MultipleChannels= {
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
 * 全部渠道（6 个）
 */
export const AllChannels= {
  args: {
    channels: AvailableChannels,
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * RCS 富媒体渠道
 *
 * 展示 RCS 与常见消息渠道并列时的激活态、未读数和 tooltip。
 */
export const RCSChannel= {
  args: {
    channels: [
      ChannelTypeEnum.SMS,
      ChannelTypeEnum.WhatsApp,
      ChannelTypeEnum.RCS,
    ],
    activeChannel: ChannelTypeEnum.RCS,
    onChannelClick: () => {},
    compact: false,
    showTooltip: true,
    unreadByChannel: {
      [ChannelTypeEnum.RCS]: 12,
    },
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
export const NonCompact= {
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
export const WithoutTooltip= {
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
export const DarkMode= {
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
export const NoActiveChannel= {
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
export const WithUnreadBadge= {
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
export const WithoutUnreadBadge= {
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
 * 禁用态渠道（通过 supportedChannels 控制启用/禁用）
 * Email 和 Viber 不在 supportedChannels 中，因此被禁用
 */
export const WithDisabledChannels= {
  args: {
    channels: AvailableChannels,
    activeChannel: ChannelTypeEnum.WhatsApp,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * 大量未读（测试 99+ 截断）
 */
export const UnreadOverflow= {
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

/**
 * WaAgent 渠道单独展示
 *
 * 自研 WhatsApp 代理渠道，使用稍深的绿色区分官方 WhatsApp
 */
export const WaAgentChannel= {
  args: {
    channels: [ChannelTypeEnum.WaAgent],
    activeChannel: ChannelTypeEnum.WaAgent,
    onChannelClick: () => {},
    compact: true,
    showTooltip: true,
  },
};

/**
 * WhatsApp vs WaAgent 对比
 *
 * 两个渠道使用相同图标但颜色不同：
 * - WhatsApp: #22C55E (green-500)
 * - WaAgent: #16A34A (green-600)
 */
export const WhatsAppVsWaAgent= {
  args: {
    channels: [ChannelTypeEnum.WhatsApp, ChannelTypeEnum.WaAgent],
    activeChannel: ChannelTypeEnum.WaAgent,
    onChannelClick: () => {},
    compact: false,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '对比官方 WhatsApp API 和自研 WaAgent 代理渠道。两者图标相同但品牌色不同。',
      },
    },
  },
};
