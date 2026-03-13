import { useState } from 'react';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ChannelBadgeSwitcher } from '@/components/composer/ChannelBadgeSwitcher';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import '@/styles/theme.css';

/**
 * ChannelBadgeSwitcher 组件 Story 文档
 *
 * 展示徽章模式的渠道切换器的各种用法：
 * - 基础示例
 * - 使用会话级别的 supportedChannels
 * - 不同渠道的切换
 * - 单渠道场景
 * - 暗色模式
 */

const meta: Meta<typeof ChannelBadgeSwitcher> = {
  title: 'Composer/ChannelBadgeSwitcher',
  component: ChannelBadgeSwitcher,
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
  },
};

export default meta;
type Story = StoryObj<typeof ChannelBadgeSwitcher>;

/**
 * 基础示例 - 默认徽章渠道切换器
 */
export const Default = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );

  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-4">
        <ChannelBadgeSwitcher
          activeChannel={activeChannel}
          onChannelChange={setActiveChannel}
        />
        <span className="text-sm text-text-muted">点击徽章切换渠道</span>
      </div>
      <p className="mt-4 text-sm text-text-muted">
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
          <ChannelBadgeSwitcher
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
 * 不同渠道 - 展示不同渠道组合
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
          <ChannelBadgeSwitcher
            supportedChannels={[ChannelTypeEnum.SMS, ChannelTypeEnum.WhatsApp]}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">SMS + WhatsApp + Email</p>
        <div className="p-4 bg-muted rounded-lg">
          <ChannelBadgeSwitcher
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
          <ChannelBadgeSwitcher
            supportedChannels={[
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Email,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Viber,
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
      <ChannelBadgeSwitcher supportedChannels={[ChannelTypeEnum.WhatsApp]} />
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
        暗色模式下的 ChannelBadgeSwitcher
      </p>
      <div className="bg-gray-800 p-4 rounded-lg">
        <ChannelBadgeSwitcher
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
 * 与输入框集成 - 展示与 Composer 的集成
 */
export const WithComposer = () => {
  const [activeChannel, setActiveChannel] = useState<ChannelTypeEnum>(
    ChannelTypeEnum.WhatsApp,
  );
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="w-96">
      <p className="text-sm font-medium mb-2">徽章切换器 + 输入框集成</p>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* 输入区域 */}
        <div className="p-3 flex items-center gap-3">
          <ChannelBadgeSwitcher
            supportedChannels={[
              ChannelTypeEnum.SMS,
              ChannelTypeEnum.WhatsApp,
              ChannelTypeEnum.Email,
            ]}
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`输入 ${activeChannel} 消息...`}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            disabled={!inputValue.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => console.log('Send:', inputValue)}
          >
            发送
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-text-muted">
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
      <div className="p-4 bg-muted rounded-lg flex items-center gap-4">
        <ChannelBadgeSwitcher
          supportedChannels={[
            ChannelTypeEnum.SMS,
            ChannelTypeEnum.WhatsApp,
            ChannelTypeEnum.Email,
          ]}
          activeChannel={activeChannel}
          onChannelChange={handleChannelChange}
        />
        <span className="text-sm text-text-muted">点击徽章切换渠道</span>
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
