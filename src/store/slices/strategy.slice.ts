import type { StateCreator } from 'zustand';
import type { AgentStatus } from '@/interfaces/agent.interface';
import { ChannelType } from '@/interfaces/channel.interface';

/**
 * Strategy Slice：渠道策略与坐席状态。
 */
export interface StrategyState {
  /** 允许的渠道列表（由 strategy.allowedChannels 约束） */
  allowedChannels: ChannelType[];
  /** 当前激活渠道 */
  activeChannel?: ChannelType;
  /** 坐席状态（用于 in_call 互斥策略） */
  agentStatus?: AgentStatus;
}

export interface StrategySlice {
  strategy: StrategyState;
  actions: {
    setStrategy: (payload: Partial<StrategyState>) => void;
    setActiveChannel: (channel: ChannelType) => void;
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
    activeChannel: ChannelType.SMS,
  },
  actions: {
    setStrategy: (payload: Partial<StrategyState>) =>
      set((state) => ({
        strategy: { ...state.strategy, ...payload },
      })),
    setActiveChannel: (channel: ChannelType) =>
      set((state) => ({
        strategy: { ...state.strategy, activeChannel: channel },
      })),
  },
});
