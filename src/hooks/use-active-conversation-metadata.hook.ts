import { useEffect } from 'react';
import {
  AvailableChannelTypes,
  type ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import { useConfig } from '@/providers/config.provider';
import { useActions, useActiveConversationId, useStrategy } from '@/store';
import { useConversationMetadata } from './use-conversation-metadata.hook';

/**
 * 活跃会话元数据同步 Hook
 *
 * @description
 * 监听 activeConversationId 变化，自动获取会话元数据，
 * 并将 supportedChannels 同步到 SDK 的 strategy.allowedChannels。
 *
 * **行为说明**：
 * - 每次切换会话时更新 `allowedChannels`。
 * - 只有当前激活渠道不被新会话支持时，才重置 `activeChannel` 为首个可用渠道，
 *   避免在用户已手动选择渠道的情况下被静默覆盖。
 *
 * @returns 元数据查询结果和活跃会话 ID
 */
export function useActiveConversationMetadata() {
  const { setStrategy } = useActions();
  const activeConversationId = useActiveConversationId();
  const config = useConfig();
  const { activeChannel, allowedChannels } = useStrategy();

  const queryResult = useConversationMetadata(activeConversationId);

  const { data: metadata } = queryResult;
  const hasActiveConversation = Boolean(activeConversationId);

  const fallbackAllowedChannels =
    config?.strategy?.allowedChannels ?? AvailableChannelTypes;
  const fallbackActiveChannel =
    config?.strategy?.activeChannel ??
    fallbackAllowedChannels[0] ??
    activeChannel;

  // 同步 supportedChannels 到 SDK strategy
  useEffect(() => {
    const nextAllowedChannels =
      hasActiveConversation && metadata?.supportedChannels?.length
        ? (metadata.supportedChannels as readonly ChannelTypeEnum[])
        : fallbackAllowedChannels;

    const isCurrentChannelAllowed = nextAllowedChannels.includes(activeChannel);
    const nextActiveChannel = isCurrentChannelAllowed
      ? activeChannel
      : nextAllowedChannels.includes(fallbackActiveChannel)
        ? fallbackActiveChannel
        : nextAllowedChannels[0];

    const shouldUpdateAllowedChannels =
      allowedChannels.length !== nextAllowedChannels.length ||
      allowedChannels.some(
        (channel, index) => channel !== nextAllowedChannels[index],
      );
    const shouldUpdateActiveChannel = nextActiveChannel !== activeChannel;

    if (!shouldUpdateAllowedChannels && !shouldUpdateActiveChannel) {
      return;
    }

    setStrategy({
      allowedChannels: nextAllowedChannels,
      ...(shouldUpdateActiveChannel
        ? { activeChannel: nextActiveChannel }
        : {}),
    });
  }, [
    metadata?.supportedChannels,
    fallbackAllowedChannels,
    fallbackActiveChannel,
    hasActiveConversation,
    setStrategy,
    activeChannel,
    allowedChannels,
  ]);

  return {
    ...queryResult,
    metadata,
  };
}
