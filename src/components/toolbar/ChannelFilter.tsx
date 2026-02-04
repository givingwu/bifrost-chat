import type { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { ChannelButtonFactory } from './ChannelButtonFactory';

export interface ChannelFilterProps {
  /** 坐席状态（in_call 时触发互斥逻辑） */
  status?: AgentStatusEnum;
  /** 允许的渠道列表 */
  channels: ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel?: ChannelTypeEnum;
  /** 点击渠道按钮回调 */
  onChannelClick?: (type: ChannelTypeEnum) => void;
}

/**
 * ChannelFilter：策略驱动的渠道工具栏。
 * - 参考 docs/architecture.md 中的 ChannelFilter 规范。
 */
export const ChannelFilter = ({
  channels,
  activeChannel,
  onChannelClick,
}: ChannelFilterProps) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center space-x-2 px-1">
        {channels.map((channel) => (
          <ChannelButtonFactory
            active={activeChannel === channel}
            key={channel}
            channel={channel}
            onClick={onChannelClick}
          />
        ))}
      </div>
    </div>
  );
};
