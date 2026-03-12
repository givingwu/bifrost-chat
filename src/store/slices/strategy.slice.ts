import type { StateCreator } from 'zustand';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import {
  AvailableChannels,
  ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import {
  ClientTypeEnum,
  type MessageTypeEnum,
} from '@/interfaces/message.interface';
import {
  type ChannelMessageTypeConfig,
  MessageTypeDisplayStrategy,
} from '@/interfaces/message-type-config.interface';
import { getDefaultChannelMessageTypes } from '@/utils/channel.utils';

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

/**
 * 规范化 allowedChannels，确保：
 * 1. 过滤掉不在 AvailableChannels 中的非法渠道
 * 2. 去重
 * 3. 按 AvailableChannels 定义的固定顺序排序
 * 4. 防空兜底：结果为空时回退到 fallback（通常为当前 allowedChannels）
 */
export function normalizeAllowedChannels(
  channels: readonly ChannelTypeEnum[],
  fallback: readonly ChannelTypeEnum[] = AvailableChannels,
): readonly ChannelTypeEnum[] {
  const valid = [...new Set(channels)].filter((ch) =>
    (AvailableChannels as readonly string[]).includes(ch),
  );

  if (valid.length === 0) return fallback;

  return valid.sort(
    (a, b) => AvailableChannels.indexOf(a) - AvailableChannels.indexOf(b),
  );
}

export const createStrategySlice: StateCreator<
  StrategySlice,
  [],
  [],
  StrategySlice
> = (set) => ({
  strategy: {
    allowedChannels: AvailableChannels,
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
    /**
     * 更新 strategy，对 allowedChannels 做完整规范化：
     * - 过滤非法渠道
     * - 去重
     * - 按 AvailableChannels 固定排序
     * - 防空兜底（回退当前值）
     * - activeChannel 联动：若新 allowedChannels 不包含目标 activeChannel，
     *   自动校正为 allowedChannels[0]
     */
    setStrategy: (payload: Partial<StrategyState>) =>
      set((state) => {
        const current = state.strategy;

        // 规范化 allowedChannels（仅在有更新时处理）
        const allowedChannels = payload.allowedChannels
          ? normalizeAllowedChannels(
              payload.allowedChannels,
              current.allowedChannels,
            )
          : current.allowedChannels;

        // activeChannel 联动校正：
        // 取 payload 中的目标值（或保持当前值），
        // 若不在最终 allowedChannels 中，自动取首位
        const rawActiveChannel = payload.activeChannel ?? current.activeChannel;
        const activeChannel = (allowedChannels as readonly string[]).includes(
          rawActiveChannel,
        )
          ? rawActiveChannel
          : allowedChannels[0];

        return {
          strategy: {
            ...current,
            ...payload,
            allowedChannels,
            activeChannel,
          },
        };
      }),

    /**
     * 切换激活渠道，仅允许切换到当前 allowedChannels 中的渠道，
     * 否则静默忽略（防止非法写入）
     */
    setActiveChannel: (channel: ChannelTypeEnum) =>
      set((state) => {
        const { allowedChannels } = state.strategy;
        if (!(allowedChannels as readonly string[]).includes(channel)) {
          return state;
        }
        return {
          strategy: { ...state.strategy, activeChannel: channel },
        };
      }),

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
