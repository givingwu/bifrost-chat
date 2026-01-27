import type { ChannelType } from '@/interfaces/chat.interface';
import { ChannelButtonFactory } from './ChannelButtonFactory';

export interface ChannelToolsListProps {
  /** 允许的渠道列表 */
  channels: ChannelType[];
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: 'online' | 'offline' | 'in_call';
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelType) => void;
}

const isDisabled = (
  type: ChannelType,
  status?: ChannelToolsListProps['status'],
) => {
  if (status !== 'in_call') {
    return false;
  }

  return type !== 'voip';
};

/**
 * ChannelToolsList：策略驱动的渠道工具栏。
 * - 参考 docs/architecture.md 中的 ChannelToolsList 规范。
 */
export const ChannelToolsList = ({
  channels,
  status,
  onChannelClick,
}: ChannelToolsListProps) => {
  return (
    <div
      data-component="channel-tools"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-soft"
    >
      {channels.map((channel) => (
        <ChannelButtonFactory
          key={channel}
          type={channel}
          disabled={isDisabled(channel, status)}
          onClick={onChannelClick}
        />
      ))}
    </div>
  );
};
