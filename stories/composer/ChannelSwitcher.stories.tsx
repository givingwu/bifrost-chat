import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelSwitcher } from '@/components/composer/ChannelSwitcher';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelSwitcher 组件 Story 文档
 *
 * 展示 Composer 场景的渠道切换器（按钮组模式）的各种用法：
 * - 基础示例（完整模式）
 * - 紧凑模式（仅图标）
 * - 使用会话级别的 supportedChannels
 * - 不同渠道的切换
 * - 单渠道场景
 * - 暗色模式
 */

const meta: Meta<typeof ChannelSwitcher> = {
  title: 'Composer/ChannelSwitcher',
  component: ChannelSwitcher,
  tags: ['autodocs'],
  argTypes: {
    supportedChannels: {
      control: 'check',
      options: Object.values(ChannelTypeEnum),
      description: '当前会话支持的渠道列表（可选）',
    },
    activeChannel: {
      control: 'select',
      options: Object.values(ChannelTypeEnum),
      description: '当前激活的渠道',
    },
    compact: {
      control: 'boolean',
      description: '是否使用紧凑模式（仅图标）',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChannelSwitcher>;

/**
 * 基础示例 - 默认渠道切换器（完整模式）
 */
export const Default = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelSwitcher
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
      />
      <p className="mt-2 text-sm text-text-muted">
        当前激活渠道: {activeChannel}
      </p>
    </div>
  );
};

/**
 * 紧凑模式 - 仅显示图标
 */
export const Compact = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelSwitcher
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        compact
      />
      <p className="mt-2 text-sm text-text-muted">
        当前激活渠道: {activeChannel}
      </p>
    </div>
  );
};

/**
 * 使用会话级别的 supportedChannels
 */
export const WithSupportedChannels = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.SMS,
  );

  const supportedChannels: ChannelTypeEnum[] = [
    ChannelTypeEnum.SMS,
    ChannelTypeEnum.WhatsApp,
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">
          会话支持的渠道: {supportedChannels.join(', ')}
        </p>
        <div className="p-4 bg-muted rounded-lg">
          <ChannelSwitcher
            supportedChannels={supportedChannels}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>
      </div>
      <p className="text-sm text-text-muted">当前激活渠道: {activeChannel}</p>
    </div>
  );
};

/**
 * 不同渠道 - 展示不同渠道的切换
 */
export const DifferentChannels = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">SMS + WhatsApp</p>
        <div className="p-4 bg-muted rounded-lg">
          <ChannelSwitcher
            supportedChannels={[ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp]}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">SMS + WhatsApp + Email</p>
        <div className="p-4 bg-muted rounded-lg">
          <ChannelSwitcher
            supportedChannels={[
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Email,
            ]}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">所有渠道</p>
        <div className="p-4 bg-muted rounded-lg">
          <ChannelSwitcher
            supportedChannels={[
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Email,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Viber,
              ChannelTypeEnum.IVR,
            ]}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>
      </div>
      <p className="text-sm text-text-muted">当前激活渠道: {activeChannel}</p>
    </div>
  );
};

/**
 * 单渠道场景 - 不显示切换器
 */
export const SingleChannel = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ChannelSwitcher supportedChannels={[ChannelTypeEnum.WhatsApp]} />
      <p className="mt-2 text-sm text-text-muted">单渠道场景，不显示切换器</p>
    </div>
  );
};

/**
 * 暗色模式 - 展示暗色模式下的样式
 */
export const DarkMode = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="dark bg-gray-900 p-4 rounded-lg">
      <p className="text-sm font-medium mb-2 text-white">
        暗色模式下的 ChannelSwitcher
      </p>
      <div className="bg-gray-800 p-4 rounded-lg">
        <ChannelSwitcher
          supportedChannels={[
            ChannelTypeEnum.SMS,
            ChannelTypeEnum.WhatsApp,
            ChannelTypeEnum.Email,
          ]}
          activeChannel={activeChannel}
          onChannelChange={setActiveChannel}
        />
      </div>
      <p className="mt-2 text-sm text-gray-400">
        当前激活渠道: {activeChannel}
      </p>
    </div>
  );
};

/**
 * 交互演示 - 展示渠道切换的交互效果
 */
export const InteractiveDemo = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );
  const [logs, setLogs] = useState<string[]>([]);

  const handleChannelChange = (channel: ChannelTypeEnum) => {
    setActiveChannel(channel);
    const log = `${new Date().toLocaleTimeString()}: 切换到 ${channel}`;
    setLogs((prev) => [log, ...prev].slice(0, 10));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <ChannelSwitcher
          supportedChannels={[
            ChannelTypeEnum.SMS,
            ChannelTypeEnum.WhatsApp,
            ChannelTypeEnum.Email,
          ]}
          activeChannel={activeChannel}
          onChannelChange={handleChannelChange}
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">切换日志：</p>
        <div className="h-48 overflow-y-auto p-2 bg-card rounded text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-text-muted">暂无切换记录</p>
          ) : (
            logs.map((log) => (
              <div key={log} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
