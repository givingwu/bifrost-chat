import { useEffect } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
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
  const { activeChannel } = useStrategy();

  const queryResult = useConversationMetadata(activeConversationId);

  const { data: metadata } = queryResult;

  // 同步 supportedChannels 到 SDK strategy
  useEffect(() => {
    if (!metadata?.supportedChannels?.length) return;

    const supportedChannels =
      metadata.supportedChannels as readonly ChannelTypeEnum[];

    // 只有当前激活渠道不在新允许列表里，才重置 activeChannel
    const isCurrentChannelAllowed = supportedChannels.includes(activeChannel);

    setStrategy({
      allowedChannels: supportedChannels,
      ...(isCurrentChannelAllowed
        ? {}
        : { activeChannel: supportedChannels[0] }),
    });
  }, [metadata?.supportedChannels, setStrategy, activeChannel]);

  return {
    ...queryResult,
    metadata,
  };
}
