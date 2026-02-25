import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { useState } from 'react';
import { NetworkStatus } from '@/components/toolbar/NetworkStatus';
import { NetworkStatusEnum } from '@/interfaces/network.interface';
import '@/styles/theme.css';

/**
 * NetworkStatus 组件 Story 文档
 *
 * 展示网络状态指示器的各种用法：
 * - 已连接
 * - 连接中
 * - 已断开
 * - 重连中
 */

const meta: Meta<typeof NetworkStatus> = {
  title: 'Toolbar/NetworkStatus',
  component: NetworkStatus,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        NetworkStatusEnum.Connected,
        NetworkStatusEnum.Connecting,
        NetworkStatusEnum.Disconnected,
      ],
      description: '网络状态',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkStatus>;

/**
 * 基础示例 - 已连接状态
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <NetworkStatus status={NetworkStatusEnum.Connected} />
    </div>
  );
};

/**
 * 所有状态 - 展示所有网络状态
 */
export const AllStatuses = () => {
  const statuses = [
    {
      status: NetworkStatusEnum.Connected,
      label: '已连接',
      desc: '网络连接正常',
      color: 'text-green-500',
    },
    {
      status: NetworkStatusEnum.Connecting,
      label: '连接中',
      desc: '正在建立连接...',
      color: 'text-yellow-500',
    },
    {
      status: NetworkStatusEnum.Disconnected,
      label: '已断开',
      desc: '网络连接已断开',
      color: 'text-red-500',
    },
    {
      status: NetworkStatusEnum.Reconnecting,
      label: '重连中',
      desc: '网络重新连接中...',
      color: 'text-lightgreen-500',
    },
  ];

  return (
    <div className="space-y-3">
      {statuses.map((item) => (
        <div
          key={item.status}
          className="flex items-center justify-between p-4 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-3">
            <NetworkStatus status={item.status} />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          </div>
          <span className={`text-xs font-medium ${item.color}`}>
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 在工具栏中使用 - 展示实际应用场景
 */
export const InToolbar = () => {
  const [status, setStatus] = useState(NetworkStatusEnum.Connected);

  const statusLabels = {
    [NetworkStatusEnum.Connected]: '在线',
    [NetworkStatusEnum.Connecting]: '连接中...',
    [NetworkStatusEnum.Disconnected]: '离线',
    [NetworkStatusEnum.Reconnecting]: '重连中...',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-soft">
        <div className="flex items-center gap-3">
          <NetworkStatus status={status} />
          <span className="text-sm font-medium">{statusLabels[status]}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatus(NetworkStatusEnum.Connected)}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded"
          >
            已连接
          </button>
          <button
            type="button"
            onClick={() => setStatus(NetworkStatusEnum.Connecting)}
            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded"
          >
            连接中
          </button>
          <button
            type="button"
            onClick={() => setStatus(NetworkStatusEnum.Disconnected)}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded"
          >
            已断开
          </button>
        </div>
      </div>
      <p className="text-xs text-text-muted">点击按钮切换网络状态</p>
    </div>
  );
};

/**
 * 状态切换动画 - 展示状态变化
 */
export const StatusTransition = () => {
  const [status, setStatus] = useState(NetworkStatusEnum.Disconnected);

  const handleConnect = () => {
    setStatus(NetworkStatusEnum.Connecting);
    setTimeout(() => {
      setStatus(NetworkStatusEnum.Connected);
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus(NetworkStatusEnum.Disconnected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-soft">
        <div className="flex items-center gap-3">
          <NetworkStatus status={status} />
          <span className="text-sm font-medium">
            {status === NetworkStatusEnum.Connected && '已连接'}
            {status === NetworkStatusEnum.Connecting && '连接中...'}
            {status === NetworkStatusEnum.Disconnected && '已断开'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={status !== NetworkStatusEnum.Disconnected}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          连接
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={status !== NetworkStatusEnum.Connected}
          className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded disabled:opacity-50"
        >
          断开
        </button>
      </div>
    </div>
  );
};
