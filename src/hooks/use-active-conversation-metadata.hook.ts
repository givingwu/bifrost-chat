import { useEffect, useMemo, useRef } from 'react';
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
 * 监听 activeConversationId 变化，自动将元数据中的 supportedChannels
 * 同步到 strategy.allowedChannels，并在必要时校正 activeChannel。
 */
export function useActiveConversationMetadata() {
  const config = useConfig();
  const { setStrategy } = useActions();
  const activeConversationId = useActiveConversationId();
  const { activeChannel, allowedChannels } = useStrategy();
  const { data: metadata } = useConversationMetadata(activeConversationId);

  // 稳定化 fallback
  const configChannels = config?.strategy?.allowedChannels;
  const fallbackChannels = useMemo(
    () => configChannels ?? AvailableChannelTypes,
    [configChannels],
  );

  // 计算目标渠道列表
  const nextChannels = useMemo(() => {
    if (activeConversationId && metadata?.supportedChannels?.length) {
      return metadata.supportedChannels as readonly ChannelTypeEnum[];
    }

    return fallbackChannels;
  }, [activeConversationId, metadata?.supportedChannels, fallbackChannels]);

  // 用 ref 访问最新 store 值，避免放进 useEffect 依赖导致循环
  const storeRef = useRef({ setStrategy, activeChannel, allowedChannels });
  storeRef.current = { setStrategy, activeChannel, allowedChannels };

  useEffect(() => {
    const {
      setStrategy: set,
      activeChannel: ac,
      allowedChannels: acs,
    } = storeRef.current;

    // 渠道列表没变就跳过
    const isSame =
      acs.length === nextChannels.length &&
      acs.every((ch, i) => ch === nextChannels[i]);
    const needSwitchChannel = !nextChannels.includes(ac);

    if (isSame && !needSwitchChannel) return;

    set({
      ...(isSame ? {} : { allowedChannels: nextChannels }),
      ...(needSwitchChannel ? { activeChannel: nextChannels[0] } : {}),
    });
  }, [nextChannels]);

  return { metadata };
}
