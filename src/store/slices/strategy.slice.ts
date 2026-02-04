import type { StateCreator } from 'zustand';
import type { AgentStatusEnum } from '@/interfaces/agent.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

/**
 * Strategy Slice：渠道策略与坐席状态。
 */
export interface StrategyState {
  /** 允许的渠道列表（由 strategy.allowedChannels 约束） */
  allowedChannels: ChannelTypeEnum[];
  /** 当前激活渠道 */
  activeChannel?: ChannelTypeEnum;
  /** 坐席状态（用于 in_call 互斥策略） */
  agentStatus?: AgentStatusEnum;
}

export interface StrategySlice {
  strategy: StrategyState;
  actions: {
    setStrategy: (payload: Partial<StrategyState>) => void;
    setActiveChannel: (channel: ChannelTypeEnum) => void;
  };
}

export const createStrategySlice: StateCreator<
  StrategySlice,
  [],
  [],
  StrategySlice
> = (set) => ({
  strategy: {
    allowedChannels: [],
    activeChannel: ChannelTypeEnum.SMS,
  },
  actions: {
    setStrategy: (payload: Partial<StrategyState>) =>
      set((state) => ({
        strategy: { ...state.strategy, ...payload },
      })),
    setActiveChannel: (channel: ChannelTypeEnum) =>
      set((state) => ({
        strategy: { ...state.strategy, activeChannel: channel },
      })),
  },
});
