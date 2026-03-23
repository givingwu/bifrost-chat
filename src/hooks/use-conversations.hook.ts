import type { InfiniteData } from '@tanstack/react-query';
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
import type { IConversationParams } from '@/services/core/conversation.service';
import { useActiveConversationId, useStrategy } from '@/store';

/**
 * 会话分页数据
 */
export interface ConversationsPage {
  items: Conversation[];
  nextCursor?: number;
}

/**
 * 计算当前界面应展示的会话列表。
 *
 * @description
 * - 当宿主启用 `channelFilterEnabled` 时，请求层已经按 `activeChannel`
 *   过滤，直接返回合并后的结果。
 * - 当宿主关闭 `channelFilterEnabled` 时，请求层会拉取全渠道会话；
 *   SDK 仍保留全量缓存和订阅，但返回给 UI 的 `data` 只暴露当前
 *   `activeChannel` 对应的会话，避免 system 模式直接渲染全量列表。
 *
 * @param conversations - 已合并 pending 的会话列表
 * @param activeChannel - 当前激活渠道
 * @param channelFilterEnabled - 是否由请求层执行渠道过滤
 * @returns 当前界面应展示的会话列表
 */
function getVisibleConversations(
  conversations: Conversation[],
  activeChannel: Conversation['channel'],
  channelFilterEnabled: boolean,
) {
  if (channelFilterEnabled) {
    return conversations;
  }

  return conversations.filter(
    (conversation) => conversation.channel === activeChannel,
  );
}

/**
 * 使用会话列表分页 Hook（Infinite Query 版本）
 *
 * @description
 * - 使用 `useInfiniteQuery` 实现滚动分页加载，首页自动请求，
 *   触底时调用 `fetchNextPage()` 加载更多。
 * - queryKey 包含 `activeChannel`，切换渠道时会重建当前列表查询与订阅。
 * - 当 `channelFilterEnabled=true` 时，宿主 `list()` 需透传
 *   `channelType` 和 `current` 参数。
 * - 当 `channelFilterEnabled=false` 时，宿主可返回全渠道会话，SDK
 *   会在返回给 UI 的 `data` 上按 `activeChannel` 做展示过滤。
 * - `list()` 返回值为 `Conversation[]`，通过返回数量判断是否有下一页
 *   （数量 >= pageSize 则认为还有下一页）。
 *
 * @example
 * ```tsx
 * const { conversations, isFetching, hasNextPage, fetchNextPage } = useConversations();
 * ```
 */
export function useConversations<TListParams = IConversationParams>(
  options?: { enabled?: boolean },
  params?: Omit<TListParams, 'channelType' | 'current' | 'pageSize'>,
) {
  const { conversationService } = useServices();
  const { activeChannel, channelFilterEnabled } = useStrategy();
  const queryClient = useQueryClient();
  const { data: creatingConversations = [] } = useQuery({
    queryKey: queryKeys.conversations.creating(activeChannel),
    queryFn: () => [] as Conversation[],
    initialData: [] as Conversation[],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
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
      if (!conversationService) {
        return {
          items: [],
          nextCursor: undefined,
        } as ConversationsPage;
      }

      const result = await conversationService.list({
        ...params,
        ...(channelFilterEnabled ? { channelType: activeChannel } : {}),
        current: pageParam as number,
        pageSize: 20,
      } as IConversationParams);

      // 每次会话列表 API 返回后，后端会提供未读基线。
      // 但在“已读 ack 后，服务器尚未回灌”这类场景中，服务器 baseline 可能滞后，
      // 直接清空负数 delta 会导致未读数回跳。
      //
      // 策略：
      // - delta >= 0：认为服务器 baseline 已包含对应的增量，直接清空。
      // - delta < 0：保留负 delta，并根据旧 baseline + delta 的 effective 值重新对齐，
      //   确保视觉未读在服务器追上前不会被回弹。
      if (result.length > 0) {
        const prevList = queryClient.getQueryData<
          InfiniteData<ConversationsPage, number>
        >(queryKeys.conversations.list(activeChannel));

        const prevUnreadById = new Map<string, number>(
          (prevList?.pages.flatMap((page) => page.items) ?? []).map((c) => [
            c.id,
            c.unreadCount ?? 0,
          ]),
        );

        queryClient.setQueryData<Record<string, number>>(
          queryKeys.conversations.unreadDeltas.conversation(),
          (old) => {
            if (!old) return old;

            const current = old;
            const updated = { ...current };

            for (const serverConversation of result) {
              const id = serverConversation.id;
              const deltaOld = current[id] ?? 0;
              if (deltaOld >= 0) {
                delete updated[id];
                continue;
              }

              const baseOld = prevUnreadById.get(id) ?? 0;
              const effectiveOld = Math.max(0, baseOld + deltaOld);
              const baseNew = serverConversation.unreadCount ?? 0;

              // 让 (baseNew + deltaNew) 的 effective 值保持与旧 effective 一致，
              // 从而避免服务器滞后造成未读数回跳。
              const deltaNew = effectiveOld - baseNew;
              if (deltaNew === 0) {
                delete updated[id];
              } else {
                updated[id] = deltaNew;
              }
            }

            return updated;
          },
        );
      }

      return {
        items: result,
        nextCursor: result.length >= 20 ? (pageParam as number) + 1 : undefined,
      } as ConversationsPage;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: (options?.enabled ?? true) && !!conversationService,
    staleTime: 1000 * 30, // 30s 内视为新鲜
  });

  const serverConversations = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const conversations = useMemo(() => {
    const mergedPendingConversations =
      ConversationCacheHelper.mergeConversationsWithPending(
        serverConversations,
        pendingConversations,
      );

    return ConversationCacheHelper.mergeConversationsWithPending(
      mergedPendingConversations,
      creatingConversations,
    );
  }, [creatingConversations, pendingConversations, serverConversations]);
  const visibleConversations = useMemo(
    () =>
      getVisibleConversations(
        conversations,
        activeChannel,
        channelFilterEnabled,
      ),
    [activeChannel, channelFilterEnabled, conversations],
  );

  const activeConversationId = useActiveConversationId();

  // 订阅会话列表更新
  useEffect(() => {
    if (
      !conversationService?.subscribeToListUpdates ||
      query.isLoading ||
      !query.data
    ) {
      return;
    }

    const unsubscribe = conversationService.subscribeToListUpdates(
      (updatedConversations: Conversation[]) => {
        ConversationCacheHelper.replaceConversationList(
          queryClient,
          updatedConversations,
          activeChannel,
        );
      },
    );

    return unsubscribe;
  }, [
    activeChannel,
    conversationService,
    query.isLoading,
    query.data,
    queryClient,
  ]);

  // 订阅当前会话的更新
  useEffect(() => {
    if (
      !conversationService?.subscribeToConversationUpdates ||
      !activeConversationId
    ) {
      return;
    }

    const unsubscribe = conversationService.subscribeToConversationUpdates(
      activeConversationId,
      (updatedConversation: Conversation) => {
        ConversationCacheHelper.replaceConversation(
          queryClient,
          updatedConversation,
          activeChannel,
        );
      },
    );

    return unsubscribe;
  }, [activeChannel, activeConversationId, conversationService, queryClient]);

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

  return {
    ...query,
    /** 当前界面可见的会话列表 */
    data: visibleConversations,
    /** 是否还有下一页 */
    hasNextPage: query.hasNextPage,
    /** 加载下一页 */
    fetchNextPage: query.fetchNextPage,
    /** 是否正在加载更多 */
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
