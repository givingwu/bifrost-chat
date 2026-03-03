import { useCallback, useMemo } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useActions, useStrategy } from '@/store';

export interface UseChannelSwitcherOptions {
  /** 当前会话支持的渠道列表（可选） */
  supportedChannels?: ChannelTypeEnum[];
  /** 当前激活的渠道（从 prop 传入） */
  activeChannel?: ChannelTypeEnum;
  /** 渠道切换回调（可选，默认使用全局 action） */
  onChannelChange?: (channel: ChannelTypeEnum) => void;
}

export interface UseChannelSwitcherReturn {
  /** 要显示的渠道列表 */
  channels: readonly ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel: ChannelTypeEnum | undefined;
  /** 处理渠道切换 */
  handleChannelChange: (channel: ChannelTypeEnum) => void;
  /** 是否应该显示切换器（多于一个渠道时显示） */
  shouldRender: boolean;
}

/**
 * useChannelSwitcher：渠道切换器共享逻辑 hook。
 *
 * @description
 * - 优先使用会话级别的 `supportedChannels`，否则使用全局的 `allowedChannels`
 * - 优先使用 prop 传入的 `activeChannel`，否则使用全局状态
 * - 支持自定义 `onChannelChange` 回调，或使用默认的全局 action
 *
 * @example
 * ```tsx
 * const { channels, activeChannel, handleChannelChange, shouldRender } =
 *   useChannelSwitcher({
 *     supportedChannels: conversation.supportedChannels,
 *     activeChannel,
 *     onChannelChange: handleChannelChange,
 *   });
 * ```
 */
export function useChannelSwitcher(
  options: UseChannelSwitcherOptions = {},
): UseChannelSwitcherReturn {
  const {
    supportedChannels,
    activeChannel: propActiveChannel,
    onChannelChange,
  } = options;

  const { allowedChannels, activeChannel: globalActiveChannel } = useStrategy();
  const { setActiveChannel } = useActions();

  // 确定要显示的渠道列表：优先使用 supportedChannels，否则使用 allowedChannels
  const channels = useMemo(() => {
    if (supportedChannels && supportedChannels.length > 0) {
      return supportedChannels as readonly ChannelTypeEnum[];
    }
    return allowedChannels;
  }, [supportedChannels, allowedChannels]);

  // 确定当前激活的渠道：优先使用 prop，否则使用全局状态
  const activeChannel = useMemo(() => {
    return propActiveChannel ?? globalActiveChannel;
  }, [propActiveChannel, globalActiveChannel]);

  // 处理渠道切换
  const handleChannelChange = useCallback(
    (channel: ChannelTypeEnum) => {
      if (onChannelChange) {
        onChannelChange(channel);
      } else {
        setActiveChannel(channel);
      }
    },
    [onChannelChange, setActiveChannel],
  );

  // 是否应该渲染（多于一个渠道时显示）
  const shouldRender = channels.length > 1;

  return {
    channels,
    activeChannel,
    handleChannelChange,
    shouldRender,
  };
}
