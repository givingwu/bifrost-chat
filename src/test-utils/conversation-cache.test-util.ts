import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';

/** 内部页面结构，与 useConversations 的 ConversationsPage 保持一致 */
interface ConversationListPage {
  items: Conversation[];
  nextCursor?: number;
}

/**
 * 测试工具：以 InfiniteQuery 格式预置会话缓存。
 *
 * 由于 useConversations 已改为 useInfiniteQuery，缓存格式是
 * `{ pages: ConversationListPage[], pageParams: number[] }`。
 * 测试中直接调用此函数代替原先的 `setQueryData<Conversation[]>(...)`.
 */
export function seedConversationCache(
  queryClient: QueryClient,
  channel: ChannelTypeEnum,
  conversations: Conversation[],
): void {
  const page: ConversationListPage = {
    items: conversations,
    nextCursor: undefined,
  };
  queryClient.setQueryData<InfiniteData<ConversationListPage, number>>(
    queryKeys.conversations.list(channel),
    {
      pages: [page],
      pageParams: [1],
    },
  );
}

export function seedPendingConversationCache(
  queryClient: QueryClient,
  channel: ChannelTypeEnum,
  conversations: Conversation[],
): void {
  queryClient.setQueryData<Conversation[]>(
    queryKeys.conversations.pending(channel),
    conversations,
  );
}
