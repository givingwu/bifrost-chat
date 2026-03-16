import { useEffect, useMemo, useRef } from 'react';
import {
  AvailableChannels,
  type ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import { useConfig } from '@/providers/config.provider';
import { useActions, useActiveConversationId, useStrategy } from '@/store';
import { normalizeAllowedChannels } from '@/store/slices/strategy.slice';
import { useConversationMetadata } from './use-conversation-metadata.hook';

/**
 * 稳定化数组引用的辅助函数
 * 当数组内容相同时返回旧引用，避免不必要的重新计算
 */
function useStableArray<T>(
  array: T[] | readonly T[] | undefined,
): T[] | readonly T[] | undefined {
  const ref = useRef<T[] | readonly T[] | undefined>(array);

  if (array === undefined) {
    ref.current = undefined;
    return undefined;
  }

  // 比较数组内容是否相同
  const prev = ref.current;
  if (
    prev &&
    prev.length === array.length &&
    prev.every((item, i) => item === array[i])
  ) {
    return prev; // 返回旧引用
  }

  ref.current = [...array]; // 存储新副本
  return ref.current;
}

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

  // 稳定化 fallback（使用 ref 避免循环依赖）
  const fallbackRef = useRef<readonly ChannelTypeEnum[]>(
    allowedChannels ?? config?.strategy?.allowedChannels ?? AvailableChannels,
  );
  // 仅当 allowedChannels 真正变化时更新 fallback
  const prevAllowedRef = useRef(allowedChannels);
  if (prevAllowedRef.current !== allowedChannels) {
    prevAllowedRef.current = allowedChannels;
    fallbackRef.current =
      allowedChannels ?? config?.strategy?.allowedChannels ?? AvailableChannels;
  }

  // 稳定化 metadata.supportedChannels 引用
  const stableSupportedChannels = useStableArray(metadata?.supportedChannels);

  // 计算目标渠道列表（使用 normalizeAllowedChannels 去重和规范化）
  const nextChannels = useMemo(() => {
    if (isFetching) return fallbackRef.current;

    if (activeConversationId && stableSupportedChannels?.length) {
      // 使用 normalizeAllowedChannels 进行去重和规范化
      return normalizeAllowedChannels(
        stableSupportedChannels as readonly ChannelTypeEnum[],
        fallbackRef.current,
      );
    }

    return fallbackRef.current;
  }, [isFetching, activeConversationId, stableSupportedChannels]);
  // 注意：fallbackRef.current 不放入依赖，避免循环

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
