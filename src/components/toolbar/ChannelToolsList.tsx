import type { AgentStatus } from '@/interfaces/agent.interface';
import type { ChannelType } from '@/interfaces/channel.interface';
import { ChannelButtonFactory } from './ChannelButtonFactory';

export interface ChannelToolsListProps {
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatus;
  /** 允许的渠道列表 */
  channels: ChannelType[];
  /** 当前激活的渠道 */
  activeChannel?: ChannelType;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelType) => void;
}

/**
 * ChannelToolsList：策略驱动的渠道工具栏。
 * - 参考 docs/architecture.md 中的 ChannelToolsList 规范。
 */
export const ChannelToolsList = ({
  channels,
  activeChannel,
  onChannelClick,
}: ChannelToolsListProps) => {
  return (
    <div
      data-component="channel-tools"
      className="inline-flex items-center space-x-1 bg-gray-100/50 dark:bg-white/10 p-1 rounded-lg backdrop-blur-sm"
    >
      {channels.map((channel) => (
        <ChannelButtonFactory
          active={activeChannel === channel}
          key={channel}
          channel={channel}
          onClick={onChannelClick}
        />
      ))}
    </div>
  );
};
