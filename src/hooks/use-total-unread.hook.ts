import { useMemo } from 'react';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { useUnreadDeltaByConversation } from '@/store';

/**
 * 计算单会话展示未读数（订阅方 unreadCount + 库内增量）
 */
function getMergedUnreadCount(unreadCount: number, delta: number): number {
  return Math.max(0, unreadCount + delta);
}

/**
 * 使用全量未读总数的 Hook
 *
 * @description
 * 基于会话列表（useConversations）与库内未读增量，计算所有会话的未读之和。
 * 展示未读 = max(0, conversation.unreadCount + delta[conversationId])。
 *
 * @param conversations 可选，若不传则内部使用 useConversations() 的数据
 * @returns 全量未读总数
 *
 * @example
 * ```tsx
 * const { totalUnread } = useTotalUnread();
 * return <Badge>{totalUnread}</Badge>;
 * ```
 */
export function useTotalUnread(conversations?: Conversation[] | null): {
  totalUnread: number;
} {
  const { data: fetchedConversations = [] } = useConversations();
  const list = conversations ?? fetchedConversations;
  const deltaByConversation = useUnreadDeltaByConversation();

  const totalUnread = useMemo(() => {
    return list.reduce((sum, conv) => {
      const delta = deltaByConversation[conv.id] ?? 0;
      const merged = getMergedUnreadCount(conv.unreadCount ?? 0, delta);
      return sum + merged;
    }, 0);
  }, [list, deltaByConversation]);

  return { totalUnread };
}

export { getMergedUnreadCount };
