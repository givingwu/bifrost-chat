import { useMemo } from 'react';
import { useConversations } from '@/hooks/use-conversations.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';

/**
 * 使用全量未读总数的 Hook
 *
 * @description
 * 基于会话列表（useConversations）计算所有会话的未读之和。
 * `Conversation.unreadCount` 是唯一展示值。
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

  const totalUnread = useMemo(() => {
    return ConversationCacheHelper.sumTotalUnread(list);
  }, [list]);

  return { totalUnread };
}
