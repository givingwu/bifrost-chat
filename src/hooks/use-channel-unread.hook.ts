import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import type { UnreadCountResult } from '@/services/core/conversation.service';
import { useStrategy } from '@/store';

/**
 * useChannelUnread：各渠道未读数量
 *
 * @description
 * 基于“后端基线 + 前端增量映射”返回各渠道当前未读数量：
 * - 基线：`conversationService.getUnreadCount()` 返回的按渠道未读数量
 * - 增量：由 `useUnreadSync` 维护的按渠道未读增量映射
 * 展示值为：`max(0, base + delta)`，仅返回大于 0 的渠道。
 * 若服务未实现 `getUnreadCount`，则仅使用增量映射。
 *
 * @param channels 可选，要计算的渠道列表；不传时使用 allowedChannels
 *
 * @example
 * ```tsx
 * const unreadByChannel = useChannelUnread(channels);
 * unreadByChannel[ChannelTypeEnum.SMS]       // → 3
 * unreadByChannel[ChannelTypeEnum.WhatsApp]  // → 10
 * ```
 */
export function useChannelUnread(
  channels?: readonly ChannelTypeEnum[],
): UnreadCountResult {
  const { conversationService } = useServices();
  const { allowedChannels } = useStrategy();
  const targetChannels = channels ?? allowedChannels;

  // 渠道级未读基线（来自服务端）
  const { data: baseUnreadByChannel } = useQuery<UnreadCountResult>({
    queryKey: queryKeys.conversations.unread(),
    // 在 enabled 为 false 时不会执行 queryFn
    // biome-ignore lint/style/noNonNullAssertion: 已通过 enabled 保护
    queryFn: () => conversationService!.getUnreadCount!(),
    enabled: !!conversationService?.getUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  // 渠道级未读增量映射（前端维护，可为负数）
  const { data: deltaUnreadByChannel } = useQuery<UnreadCountResult>({
    queryKey: queryKeys.conversations.unreadDeltas.channel(),
    queryFn: async () => ({}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return useMemo(() => {
    const base = baseUnreadByChannel ?? {};
    const delta = deltaUnreadByChannel ?? {};

    // 只返回 targetChannels 内的渠道
    const result: Partial<Record<ChannelTypeEnum, number>> = {};

    for (const channel of targetChannels) {
      const baseCount = base[channel] ?? 0;
      const deltaCount = delta[channel] ?? 0;
      const count = Math.max(0, baseCount + deltaCount);
      if (count != null && count > 0) {
        result[channel] = count;
      }
    }
    return result;
  }, [baseUnreadByChannel, deltaUnreadByChannel, targetChannels]);
}
