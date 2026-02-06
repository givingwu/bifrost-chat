import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChannelButtonFactory } from '@/components/toolbar/ChannelButtonFactory';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import zhCN from '@/locales/zh-CN.json';
import { I18nProvider } from '@/providers/I18n.provider';
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
  decorators: [
    (Story) => (
      <I18nProvider locale="zh-CN" messages={zhCN}>
        <Story />
      </I18nProvider>
    ),
  ],
  argTypes: {
    channel: {
      control: 'select',
      options: [
        ChannelTypeEnum.SMS,
        ChannelTypeEnum.WhatsApp,
        ChannelTypeEnum.Email,
      ],
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
        channel={ChannelTypeEnum.SMS}
        onClick={(type) => console.log('Clicked:', type)}
      />
    </div>
  );
};

/**
 * 所有渠道 - 展示所有可用渠道
 */
export const AllChannels = () => {
  const channels = [
    ChannelTypeEnum.SMS,
    ChannelTypeEnum.WhatsApp,
    ChannelTypeEnum.Email,
  ];

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
        channel={ChannelTypeEnum.SMS}
        active
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelTypeEnum.WhatsApp}
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelTypeEnum.Email}
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
        channel={ChannelTypeEnum.SMS}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelTypeEnum.WhatsApp}
        disabled
        onClick={(type) => console.log('Clicked:', type)}
      />
      <ChannelButtonFactory
        channel={ChannelTypeEnum.Email}
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
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.SMS,
  );

  const channels = [
    ChannelTypeEnum.SMS,
    ChannelTypeEnum.WhatsApp,
    ChannelTypeEnum.Email,
  ];

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
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  const channels = [
    ChannelTypeEnum.SMS,
    ChannelTypeEnum.WhatsApp,
    ChannelTypeEnum.Email,
  ];

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
