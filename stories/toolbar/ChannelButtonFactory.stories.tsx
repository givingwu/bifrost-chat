import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelButtonFactory } from '@/components/toolbar/ChannelButtonFactory';
import { AvailableChannels, ChannelTypeEnum } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelButtonFactory 组件 Story 文档
 */
const meta: Meta<typeof ChannelButtonFactory> = {
  title: 'Toolbar/ChannelButtonFactory',
  component: ChannelButtonFactory,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      control: 'select',
      options: AvailableChannels,
      description: '渠道类型',
    },
    active: {
      control: 'boolean',
      description: '是否激活',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelButtonFactory>;

/**
 * 基础示例 - SMS 渠道
 */
export const Default = () => (
  <div className="p-4 bg-muted rounded-lg">
    <ChannelButtonFactory
      channel={ChannelTypeEnum.SMS}
      onClick={(type) => console.log('Clicked:', type)}
    />
  </div>
);

/**
 * 全部渠道（5 个）
 */
export const AllChannels = () => (
  <div className="flex gap-2 p-4 bg-muted rounded-lg flex-wrap">
    {AvailableChannels.map((channel) => (
      <ChannelButtonFactory
        key={channel}
        channel={channel}
        onClick={(type) => console.log('Clicked:', type)}
      />
    ))}
  </div>
);

/**
 * 激活状态 — 各渠道品牌色高亮
 */
export const ActiveState = () => (
  <div className="flex gap-2 p-4 bg-muted rounded-lg flex-wrap">
    {AvailableChannels.map((channel) => (
      <ChannelButtonFactory
        key={channel}
        channel={channel}
        active
        onClick={(type) => console.log('Clicked:', type)}
      />
    ))}
  </div>
);

/**
 * 禁用状态
 */
export const Disabled = () => (
  <div className="flex gap-2 p-4 bg-muted rounded-lg flex-wrap">
    {AvailableChannels.map((channel) => (
      <ChannelButtonFactory
        key={channel}
        channel={channel}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
    ))}
  </div>
);

/**
 * 交互示例 - 点击切换
 */
export const Interactive = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.SMS,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-4 bg-muted rounded-lg flex-wrap">
        {AvailableChannels.map((channel) => (
          <ChannelButtonFactory
            key={channel}
            channel={channel}
            active={activeChannel === channel}
            onClick={setActiveChannel}
          />
        ))}
      </div>
      <p className="text-sm text-text-muted">当前激活: {activeChannel}</p>
    </div>
  );
};

/**
 * 在工具栏中使用
 */
export const InToolbar = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">选择渠道</h3>
        <div className="flex gap-2">
          {AvailableChannels.map((channel) => (
            <ChannelButtonFactory
              key={channel}
              channel={channel}
              active={activeChannel === channel}
              onClick={setActiveChannel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
