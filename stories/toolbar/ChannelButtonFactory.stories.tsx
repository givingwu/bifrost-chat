import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChannelButtonFactory } from '@/components/toolbar/ChannelButtonFactory';
import { ChannelType } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelButtonFactory 组件 Story 文档
 *
 * 展示渠道按钮工厂的各种用法：
 * - 不同渠道类型
 * - 激活/非激活状态
 * - 禁用状态
 */

const meta: Meta<typeof ChannelButtonFactory> = {
  title: 'Toolbar/ChannelButtonFactory',
  component: ChannelButtonFactory,
  tags: ['autodocs'],
  argTypes: {
    channel: {
      control: 'select',
      options: [ChannelType.SMS, ChannelType.WhatsApp, ChannelType.Email],
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
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelButtonFactory
        channel={ChannelType.SMS}
        onClick={(type) => console.log('Clicked:', type)}
      />
    </div>
  );
};

/**
 * 所有渠道 - 展示所有可用渠道
 */
export const AllChannels = () => {
  const channels = [ChannelType.SMS, ChannelType.WhatsApp, ChannelType.Email];

  return (
    <div className="flex gap-2 p-4 bg-muted rounded-lg">
      {channels.map((channel) => (
        <ChannelButtonFactory
          key={channel}
          channel={channel}
          onClick={(type) => console.log('Clicked:', type)}
        />
      ))}
    </div>
  );
};

/**
 * 激活状态 - 展示激活的渠道
 */
export const ActiveState = () => {
  return (
    <div className="flex gap-2 p-4 bg-muted rounded-lg">
      <ChannelButtonFactory
        channel={ChannelType.SMS}
        active
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelType.WhatsApp}
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelType.Email}
        onClick={(type) => console.log('Clicked:', type)}
      />
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="flex gap-2 p-4 bg-muted rounded-lg">
      <ChannelButtonFactory
        channel={ChannelType.SMS}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelType.WhatsApp}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelType.Email}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
    </div>
  );
};

/**
 * 交互示例 - 点击切换
 */
export const Interactive = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>(
    ChannelType.SMS,
  );

  const channels = [ChannelType.SMS, ChannelType.WhatsApp, ChannelType.Email];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-4 bg-muted rounded-lg">
        {channels.map((channel) => (
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
 * 实际应用 - 在工具栏中使用
 */
export const InToolbar = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>(
    ChannelType.WhatsApp,
  );

  const channels = [ChannelType.SMS, ChannelType.WhatsApp, ChannelType.Email];

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">选择渠道</h3>
        <div className="flex gap-2">
          {channels.map((channel) => (
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
