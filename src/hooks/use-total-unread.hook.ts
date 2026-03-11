import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useStrategy } from '@/store';

/**
 * useTotalUnread：全局总未读数
 *
 * @description
 * 遍历所有 `allowedChannels` 的 conversation list 缓存求和。
 * 与 `Conversation.unreadCount` 始终保持一致，无需单独维护。
 *
 * @param conversations 可选，直接传入会话列表（优先于缓存读取）
 * @returns 全量未读总数
 */
export function useTotalUnread(conversations?: Conversation[] | null): {
  totalUnread: number;
} {
  const queryClient = useQueryClient();
  const { allowedChannels } = useStrategy();

  const totalUnread = useMemo(() => {
    // 若调用方直接传入 conversations（如 DefaultChatLayout），直接求和
    if (conversations !== undefined) {
      return (conversations ?? []).reduce(
        (sum, conv) => sum + Math.max(0, conv.unreadCount),
        0,
      );
    }

    // 否则遍历所有渠道的缓存列表求和（全局模式）
    let total = 0;

    for (const channel of allowedChannels) {
      const list =
        queryClient.getQueryData<Conversation[]>(
          queryKeys.conversations.list(channel),
        ) ?? [];
      for (const conv of list) {
        total += Math.max(0, conv.unreadCount);
      }
    }

    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, queryClient, allowedChannels]);

  return { totalUnread };
}
