import { useMemo } from 'react';
import { useConversations } from '@/hooks/use-conversations.hook';
import { useUnreadCount } from '@/hooks/use-unread-count.hook';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { useServices } from '@/providers/service.provider';

/**
 * 使用全量未读总数的 Hook
 *
 * @description
 * - 若 `conversationService` 实现了 `getUnreadCount`，优先使用服务端返回的 `total`（精确值）
 * - 否则回退到本地 `Conversation.unreadCount` 字段求和（兼容旧实现）
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
  const { conversationService } = useServices();
  const { data: fetchedConversations = [] } = useConversations();
  const list = conversations ?? fetchedConversations;

  // 服务端精确未读数（若服务未实现则 data 为 undefined）
  const { data: serverUnread } = useUnreadCount();

  const totalUnread = useMemo(() => {
    // 优先使用服务端精确值（按渠道求和得到全局总数）
    if (conversationService?.getUnreadCount && serverUnread) {
      const serverTotal = Object.values(serverUnread).reduce(
        (sum, count) => sum + (count ?? 0),
        0,
      );
      return serverTotal;
    }
    // 降级：本地会话列表累加
    return ConversationCacheHelper.sumTotalUnread(list);
  }, [conversationService, serverUnread, list]);

  return { totalUnread };
}

