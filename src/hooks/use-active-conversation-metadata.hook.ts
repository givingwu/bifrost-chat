import { useEffect } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useActions, useActiveConversationId } from '@/store';
import { useConversationMetadata } from './use-conversation-metadata.hook';

/**
 * 活跃会话元数据同步 Hook
 *
 * @description
 * 监听 activeConversationId 变化，自动获取会话元数据，
 * 并将 supportedChannels 同步到 SDK 的 strategy.allowedChannels。
 *
 * @returns 元数据查询结果和活跃会话 ID
 *
 * @example
 * ```tsx
 * function App() {
 *   // 在应用顶层调用，自动同步会话支持的渠道到 SDK
 *   const { metadata, isLoading, activeConversationId } = useActiveConversationMetadata();
 *
 *   return (
 *     <div>
 *       {isLoading && <Spinner />}
 *       <p>当前会话: {activeConversationId}</p>
 *       <p>支持渠道: {metadata?.supportedChannels?.join(', ')}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useActiveConversationMetadata() {
  const { setStrategy } = useActions();
  const activeConversationId = useActiveConversationId();

  const queryResult = useConversationMetadata(activeConversationId);

  const { data: metadata } = queryResult;

  // 同步 supportedChannels 到 SDK strategy
  useEffect(() => {
    if (metadata?.supportedChannels?.length) {
      const supportedChannels =
        metadata.supportedChannels as readonly ChannelTypeEnum[];

      setStrategy({
        allowedChannels: supportedChannels,
        activeChannel: supportedChannels[0],
      });
    }
  }, [metadata?.supportedChannels, setStrategy]);

  return {
    ...queryResult,
    metadata,
  };
}
