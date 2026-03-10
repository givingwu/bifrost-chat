import type { StateCreator } from 'zustand';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import {
  AvailableChannelTypes,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import {
  ClientTypeEnum,
  type MessageTypeEnum,
} from '@/interfaces/message.interface';
import {
  type ChannelMessageTypeConfig,
  getDefaultChannelMessageTypes,
  MessageTypeDisplayStrategy,
} from '@/interfaces/message-type-config.interface';

/**
 * 当前用户信息（坐席）
 */
export interface CurrentUser {
  /** 应用标识（租户） */
  app: string;
  /** 用户标识（PIN/UID/电话/邮箱） */
  pin: string;
  /** 坐席状态（用于 in_call 互斥策略） */
  status: AgentStatusEnum;
  /** 客户端类型（用于消息协议中的 clientType 字段） */
  clientType?: ClientTypeEnum;
}

/**
 * Strategy Slice：渠道策略与坐席状态。
 */
export interface StrategyState {
  /** 允许的渠道列表（由 strategy.allowedChannels 约束） */
  allowedChannels: readonly ChannelTypeEnum[];
  /** 当前激活渠道 */
  activeChannel: ChannelTypeEnum;
  /** 坐席状态（用于 in_call 互斥策略） */
  agentStatus?: AgentStatusEnum;
  /** 当前用户信息（坐席） */
  currentUser: CurrentUser;
  /** 允许的消息类型列表（当前激活渠道） */
  allowedMessageTypes: MessageTypeEnum[];
  /** 不支持消息的显示策略 */
  messageDisplayStrategy: MessageTypeDisplayStrategy;
  /** 自定义不支持提示文案 */
  unsupportedMessage?: string;
  /** 按渠道配置的消息类型支持 */
  channelMessageTypeConfigs?: Partial<
    Record<ChannelTypeEnum, ChannelMessageTypeConfig>
  >;
}

export interface StrategySlice {
  strategy: StrategyState;
  actions: {
    setStrategy: (payload: Partial<StrategyState>) => void;
    setActiveChannel: (channel: ChannelTypeEnum) => void;
    setCurrentUser: (user: CurrentUser) => void;
    setAllowedMessageTypes: (types: MessageTypeEnum[]) => void;
    setMessageDisplayStrategy: (strategy: MessageTypeDisplayStrategy) => void;
    updateChannelMessageTypeConfig: (
      channel: ChannelTypeEnum,
      config: ChannelMessageTypeConfig,
    ) => void;
  };
}

export const createStrategySlice: StateCreator<
  StrategySlice,
  [],
  [],
  StrategySlice
> = (set) => ({
  strategy: {
    allowedChannels: AvailableChannelTypes,
    activeChannel: ChannelTypeEnum.SMS,
    // currentUser 在宿主调用 configureChatStore / setCurrentUser 之前为空默认值。
    // 注意：pin 为空字符串时 SDK 不应发送协议消息，宿主需在使用前完成初始化。
    currentUser: {
      app: '',
      pin: '',
      status: AgentStatusEnum.Offline,
      clientType: ClientTypeEnum.Web,
    },
    allowedMessageTypes: getDefaultChannelMessageTypes(
      ChannelTypeEnum.WhatsApp,
    ),
    messageDisplayStrategy: MessageTypeDisplayStrategy.ShowUnsupported,
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
    setCurrentUser: (user) =>
      set((state) => ({
        strategy: { ...state.strategy, currentUser: user },
      })),
    setAllowedMessageTypes: (types: MessageTypeEnum[]) =>
      set((state) => ({
        strategy: { ...state.strategy, allowedMessageTypes: types },
      })),
    setMessageDisplayStrategy: (strategy: MessageTypeDisplayStrategy) =>
      set((state) => ({
        strategy: {
          ...state.strategy,
          messageDisplayStrategy: strategy,
        },
      })),
    updateChannelMessageTypeConfig: (
      channel: ChannelTypeEnum,
      config: ChannelMessageTypeConfig,
    ) =>
      set((state) => ({
        strategy: {
          ...state.strategy,
          channelMessageTypeConfigs: {
            ...state.strategy.channelMessageTypeConfigs,
            [channel]: config,
          },
        },
      })),
  },
});
