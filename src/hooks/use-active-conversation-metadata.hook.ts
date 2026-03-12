import { useEffect, useMemo, useRef } from 'react';
import {
  AvailableChannels,
  type ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import { useConfig } from '@/providers/config.provider';
import { useActions, useActiveConversationId, useStrategy } from '@/store';
import { useConversationMetadata } from './use-conversation-metadata.hook';

/**
 * 活跃会话元数据同步 Hook
 *
 * 监听 activeConversationId 变化，自动将元数据中的 supportedChannels
 * 同步到 strategy.allowedChannels，并在必要时校正 activeChannel。
 */
export function useActiveConversationMetadata() {
  const config = useConfig();
  const { setStrategy } = useActions();
  const activeConversationId = useActiveConversationId();
  const { activeChannel, allowedChannels } = useStrategy();
  const { data: metadata, isFetching } =
    useConversationMetadata(activeConversationId);

  // 稳定化 fallback
  const fallbackChannels = useMemo(
    () =>
      allowedChannels ?? config?.strategy?.allowedChannels ?? AvailableChannels,
    [allowedChannels, config?.strategy?.allowedChannels],
  );

  // 计算目标渠道列表
  const nextChannels = useMemo(() => {
    if (isFetching) return fallbackChannels;
    else {
      if (activeConversationId && metadata?.supportedChannels?.length) {
        // DEBUG: 记录 metadata.supportedChannels 的使用
        console.log(
          '[DEBUG useActiveConversationMetadata] computing nextChannels from metadata',
          {
            conversationId: activeConversationId,
            supportedChannels: metadata.supportedChannels,
          },
        );
        return [...metadata.supportedChannels].sort(
          (a, b) =>
            AvailableChannels.indexOf(a as ChannelTypeEnum) -
            AvailableChannels.indexOf(b as ChannelTypeEnum),
        ) as readonly ChannelTypeEnum[];
      }

      return fallbackChannels;
    }
  }, [
    isFetching,
    activeConversationId,
    metadata?.supportedChannels,
    fallbackChannels,
  ]);

  // 用 ref 访问最新值，避免放进 useEffect 依赖导致循环
  const latestRef = useRef({
    setStrategy,
    activeChannel,
    allowedChannels,
    activeConversationId,
    isFetching,
  });
  latestRef.current = {
    setStrategy,
    activeChannel,
    allowedChannels,
    activeConversationId,
    isFetching,
  };

  useEffect(() => {
    const {
      setStrategy,
      activeChannel,
      allowedChannels,
      activeConversationId,
      isFetching,
    } = latestRef.current;

    // metadata 还在加载中：跳过，避免 fallback 全量渠道覆盖 store
    if (activeConversationId && isFetching) {
      return;
    }

    // 渠道列表没变就跳过（顺序无关的比较）
    const isSame =
      allowedChannels.length === nextChannels.length &&
      allowedChannels.every((channel) => nextChannels.includes(channel));
    const needSwitchChannel = !nextChannels.includes(activeChannel);

    if (isSame && !needSwitchChannel) return;

    setStrategy({
      ...(isSame ? {} : { allowedChannels: nextChannels }),
      ...(needSwitchChannel ? { activeChannel: nextChannels[0] } : {}),
    });
  }, [nextChannels]);

  return { metadata };
}
