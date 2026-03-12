import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AvailableChannelTypes } from '@/interfaces/channel.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

/**
 * useTotalUnread：全局总未读数
 *
 * @description
 * - **全局模式**（不传 conversations）：调用 `conversationService.getUnreadCount()` API
 *   获取服务端精确未读数，对所有 `allowedChannels` 对应渠道的值求和。
 *   若服务未实现 `getUnreadCount`，则返回 0。
 *
 * @param conversations 可选，直接传入会话列表（优先于 API 调用）
 * @returns 全量未读总数
 */
export function useTotalUnread(): {
  totalUnread: number;
} {
  const { conversationService } = useServices();

  const { data: unreadByChannel, isFetching } = useQuery({
    queryKey: queryKeys.conversations.unread(),
    queryFn: () => conversationService?.getUnreadCount?.(),
    enabled: !!conversationService?.getUnreadCount,
    staleTime: 1000 * 30, // 30 秒内视为新鲜
    refetchInterval: 1000 * 60, // 每分钟后台轮询一次
  });

  const totalUnread = useMemo(() => {
    if (!unreadByChannel || !isFetching) return 0;

    return AvailableChannelTypes.reduce((sum, channel) => {
      return sum + Math.max(0, unreadByChannel[channel] ?? 0);
    }, 0);
  }, [unreadByChannel, isFetching]);

  return { totalUnread };
}
