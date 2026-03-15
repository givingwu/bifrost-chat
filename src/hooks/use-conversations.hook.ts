import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { useStrategy } from '@/store';

/**
 * 使用会话列表分页 Hook（Infinite Query 版本）
 *
 * @description
 * - 使用 `useInfiniteQuery` 实现滚动分页加载，首页自动请求，
 *   触底时调用 `fetchNextPage()` 加载更多。
 * - queryKey 包含 `activeChannel`，切换渠道自动重新拉取对应渠道会话。
 * - 宿主 `list()` 需透传 `channelType` 和 `current` 参数。
 *
 * @example
 * ```tsx
 * const { conversations, isFetching, hasNextPage, fetchNextPage } = useConversations();
 * ```
 */
export function useConversations<TListParams = Record<string, unknown>>(
  options?: { enabled?: boolean },
  params?: Omit<TListParams, 'channelType' | 'current' | 'pageSize'>,
) {
  const { conversationService } = useServices();
  const { activeChannel, channelFilterEnabled } = useStrategy();
  const queryClient = useQueryClient();
  const { data: pendingConversations = [] } = useQuery({
    queryKey: queryKeys.conversations.pending(activeChannel),
    queryFn: () => [] as Conversation[],
    initialData: [] as Conversation[],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const query = useInfiniteQuery({
    queryKey: queryKeys.conversations.list(activeChannel),
    queryFn: async ({ pageParam = 1 }) => {
      if (!conversationService) return [];
      const result = await conversationService.list({
        ...params,
        ...(channelFilterEnabled ? { channelType: activeChannel } : {}),
        current: pageParam as number,
        pageSize: 20,
      } as TListParams);
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // 宿主层会在返回数组上挂载 total 字段
      const total =
        (lastPage as Conversation[] & { total?: number }).total ?? 0;
      const fetched = allPages.flat().length;
      return fetched < total ? allPages.length + 1 : undefined;
    },
    enabled: (options?.enabled ?? true) && !!conversationService,
    staleTime: 1000 * 60 * 5,
  });

  const serverConversations = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  const conversations = useMemo(
    () =>
      ConversationCacheHelper.mergeConversationsWithPending(
        serverConversations,
        pendingConversations,
      ),
    [pendingConversations, serverConversations],
  );

  useEffect(() => {
    if (pendingConversations.length === 0 || serverConversations.length === 0) {
      return;
    }

    ConversationCacheHelper.confirmPendingConversations(
      queryClient,
      activeChannel,
      serverConversations.map((conversation) => conversation.id),
    );
  }, [activeChannel, pendingConversations, queryClient, serverConversations]);

  // 推导扁平会话列表（所有页合并）
  // 使用 useMemo 稳定化数组引用，避免每次渲染都创建新数组
  const conversationIdsKey = useMemo(() => {
    if (conversations.length === 0) return '';

    return conversations.map((conversation) => conversation.id).join('|');
  }, [conversations]);

  useEffect(() => {
    if (!conversationService?.subscribeToListUpdates) {
      return;
    }

    return conversationService.subscribeToListUpdates((nextConversations) => {
      ConversationCacheHelper.replaceConversationList(
        queryClient,
        nextConversations,
        activeChannel,
      );
    });
  }, [activeChannel, conversationService, queryClient]);

  useEffect(() => {
    const conversationIds = conversationIdsKey
      ? conversationIdsKey.split('|')
      : [];

    if (
      !conversationService?.subscribeToConversationUpdates ||
      conversationIds.length === 0
    ) {
      return;
    }

    const unsubscribeCallbacks = conversationIds.map((conversationId) =>
      conversationService.subscribeToConversationUpdates?.(
        conversationId,
        (conversation) => {
          ConversationCacheHelper.replaceConversation(
            queryClient,
            conversation,
            activeChannel,
          );
        },
      ),
    );

    return () => {
      for (const unsubscribe of unsubscribeCallbacks) {
        unsubscribe?.();
      }
    };
  }, [activeChannel, conversationIdsKey, conversationService, queryClient]);

  return {
    ...query,
    /** 扁平化后的全部会话（所有已加载页合并） */
    data: conversations,
    /** 是否还有下一页 */
    hasNextPage: query.hasNextPage,
    /** 加载下一页 */
    fetchNextPage: query.fetchNextPage,
    /** 是否正在加载更多 */
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
