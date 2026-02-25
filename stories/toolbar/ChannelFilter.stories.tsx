import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState } from 'react';
import { ChannelFilter } from '@/components/toolbar/ChannelFilter';
import {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelFilter 组件 Story 文档
 *
 * 展示渠道筛选器的各种用法：
 * - 不同渠道
 * - 激活状态
 * - 交互示例
 */

const meta: Meta<typeof ChannelFilter> = {
  title: 'Toolbar/ChannelFilter',
  component: ChannelFilter,
  tags: ['autodocs'],
  argTypes: {
    channels: {
      control: 'check',
      options: AvailableChannelTypes,
      description: '可用渠道列表',
    },
    activeChannel: {
      control: 'select',
      options: AvailableChannelTypes,
      description: '当前激活的渠道',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelFilter>;

/**
 * 基础示例 - 默认渠道筛选器
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelFilter
        channels={AvailableChannelTypes}
        activeChannel={ChannelTypeEnum.WhatsApp}
      />
    </div>
  );
};

/**
 * 不同激活状态 - 展示不同渠道激活
 */
export const ActiveStates = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">SMS 激活</p>
        <ChannelFilter
          channels={AvailableChannelTypes}
          activeChannel={ChannelTypeEnum.SMS}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">WhatsApp 激活</p>
        <ChannelFilter
          channels={AvailableChannelTypes}
          activeChannel={ChannelTypeEnum.WhatsApp}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">Email 激活</p>
        <ChannelFilter
          channels={AvailableChannelTypes}
          activeChannel={ChannelTypeEnum.Email}
        />
      </div>
    </div>
  );
};

/**
 * 交互示例 - 点击切换
 */
export const Interactive = () => {
  const [activeChannel, setActiveChannel] = useState(ChannelTypeEnum.WhatsApp);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <ChannelFilter
          channels={AvailableChannelTypes}
          activeChannel={activeChannel}
          onChannelClick={setActiveChannel}
        />
      </div>
      <p className="text-sm text-text-muted">当前激活: {activeChannel}</p>
    </div>
  );
};

/**
 * 部分渠道 - 展示部分可用渠道
 */
export const PartialChannels = () => {
  const channels = [ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelFilter channels={channels} activeChannel={ChannelTypeEnum.SMS} />
    </div>
  );
};

/**
 * 在工具栏中使用 - 展示实际应用场景
 */
export const InToolbar = () => {
  const [activeChannel, setActiveChannel] = useState(ChannelTypeEnum.WhatsApp);

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">筛选渠道</h3>
        <ChannelFilter
          channels={AvailableChannelTypes}
          activeChannel={activeChannel}
          onChannelClick={setActiveChannel}
        />
      </div>
    </div>
  );
};
