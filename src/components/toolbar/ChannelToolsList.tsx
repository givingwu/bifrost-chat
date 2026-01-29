import { AgentStatus } from '@/interfaces/agent.interface';
import type { ChannelType } from '@/interfaces/channel.interface';
import { ChannelButtonFactory } from './ChannelButtonFactory';

export interface ChannelToolsListProps {
  /** 允许的渠道列表 */
  channels: ChannelType[];
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatus;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelType) => void;
}

const isDisabled = (
  type: ChannelType,
  status?: ChannelToolsListProps['status'],
) => {
  if (status !== AgentStatus.InCall) {
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
      className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-1.5"
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
