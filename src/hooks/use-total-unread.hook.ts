import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { useStrategy } from '@/store';

/**
 * useTotalUnread：全局总未读数
 *
 * @description
 * - **全局模式**（不传 conversations）：调用 `conversationService.getUnreadCount()` API
 *   获取服务端精确未读数，对所有 `allowedChannels` 对应渠道的值求和。
 *   若服务未实现 `getUnreadCount`，则返回 0。
 * - **本地模式**（传入 conversations 数组）：对传入列表的 `unreadCount` 字段直接求和，
 *   用于 `DefaultChatLayout` 内部通过当前聊天列表做实时展示的场景。
 *
 * @param conversations 可选，直接传入会话列表（优先于 API 调用）
 * @returns 全量未读总数
 */
export function useTotalUnread(conversations?: Conversation[] | null): {
  totalUnread: number;
} {
  const { conversationService } = useServices();
  const { allowedChannels } = useStrategy();

  // 全局模式：调用 getUnreadCount API（仅在不传 conversations 时启用）
  const { data: unreadByChannel } = useQuery({
    queryKey: queryKeys.conversations.unread(),
    queryFn: () => conversationService!.getUnreadCount!(),
    enabled:
      conversations === undefined &&
      !!conversationService?.getUnreadCount,
    staleTime: 1000 * 30, // 30 秒内视为新鲜
    refetchInterval: 1000 * 60, // 每分钟后台轮询一次
  });

  const totalUnread = useMemo(() => {
    // 本地模式：对传入会话列表直接求和（用于 DefaultChatLayout 实时场景）
    if (conversations !== undefined) {
      return (conversations ?? []).reduce(
        (sum, conv) => sum + Math.max(0, conv.unreadCount),
        0,
      );
    }

    // 全局模式：对 API 返回的按渠道分布未读数，仅统计 allowedChannels 内的渠道
    if (!unreadByChannel) return 0;

    return allowedChannels.reduce((sum, channel) => {
      return sum + Math.max(0, unreadByChannel[channel] ?? 0);
    }, 0);
  }, [conversations, unreadByChannel, allowedChannels]);

  return { totalUnread };
}
