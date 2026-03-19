import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AvailableChannels } from '@/interfaces/channel.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import type { UnreadCountResult } from '@/services/core/conversation.service';

/**
 * useTotalUnread：全局总未读数
 *
 * @description
 * - 基于“后端基线 + 前端增量映射”计算总未读：
 *   - 基线：`conversationService.getUnreadCount()` 返回的按渠道未读数量（与 useChannelUnread 同键，仅初始化拉取一次）
 *   - 增量：由 `useUnreadSync` 维护的按渠道未读增量映射
 *   - 展示值：对所有渠道的 `max(0, base + delta)` 求和
 *   若服务未实现 `getUnreadCount`，则仅使用增量映射（通常为 0）。
 *
 * @param conversations 可选，直接传入会话列表（优先于 API 调用）
 * @returns 全量未读总数
 */
export function useTotalUnread(): {
  totalUnread: number;
} {
  const { conversationService } = useServices();

  // 渠道级未读基线（来自服务端）
  const { data: baseUnreadByChannel } = useQuery<UnreadCountResult>({
    queryKey: queryKeys.conversations.unread(),
    // 在 enabled 为 false 时不会执行 queryFn
    // biome-ignore lint/style/noNonNullAssertion: 已通过 enabled 保护
    queryFn: () => conversationService!.getUnreadCount!(),
    enabled: !!conversationService?.getUnreadCount,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // 渠道级未读增量映射（前端维护，可为负数）
  const { data: deltaUnreadByChannel } = useQuery<UnreadCountResult>({
    queryKey: queryKeys.conversations.unreadDeltas.channel(),
    // 纯前端状态，queryFn 仅提供一个空对象作为初始值
    queryFn: async () => ({}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const totalUnread = useMemo(() => {
    const base = baseUnreadByChannel ?? {};
    const delta = deltaUnreadByChannel ?? {};

    return AvailableChannels.reduce((sum, channel) => {
      const baseCount = base[channel] ?? 0;
      const deltaCount = delta[channel] ?? 0;
      const effective = Math.max(0, baseCount + deltaCount);
      return sum + effective;
    }, 0);
  }, [baseUnreadByChannel, deltaUnreadByChannel]);

  return { totalUnread };
}
