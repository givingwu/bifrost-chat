import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';

/**
 * 测试工具：以 InfiniteQuery 格式预置会话缓存。
 *
 * 由于 useConversations 已改为 useInfiniteQuery，缓存格式是
 * `{ pages: Conversation[][], pageParams: number[] }`。
 * 测试中直接调用此函数代替原先的 `setQueryData<Conversation[]>(...)`.
 */
export function seedConversationCache(
  queryClient: QueryClient,
  channel: ChannelTypeEnum,
  conversations: Conversation[],
): void {
  queryClient.setQueryData<InfiniteData<Conversation[], number>>(
    queryKeys.conversations.list(channel),
    { pages: [conversations], pageParams: [1] },
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
