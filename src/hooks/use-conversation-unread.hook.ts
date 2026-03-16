import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/providers/query.provider';

/**
 * useConversationUnread：单会话未读数量
 *
 * @description
 * - 基线：来自会话实体上的 `conversation.unreadCount`
 * - 增量：由 `useUnreadSync` 维护的按会话未读增量映射
 * 展示值为：`max(0, base + delta)`。
 */
export function useConversationUnread(
  conversationId: string,
  baseUnreadCount: number,
): number {
  const { data: deltaUnreadByConversation } = useQuery<
    Record<string, number>
  >({
    queryKey: queryKeys.conversations.unreadDeltas.conversation(),
    // 纯前端状态，queryFn 仅提供一个空对象作为初始值
    queryFn: async () => ({}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return useMemo(() => {
    const delta = deltaUnreadByConversation?.[conversationId] ?? 0;
    const effective = Math.max(0, (baseUnreadCount ?? 0) + delta);
    return effective;
  }, [baseUnreadCount, conversationId, deltaUnreadByConversation]);
}

