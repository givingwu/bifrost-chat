import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import {
  type ConversationMergeOptions,
  type ConversationMergeSource,
  mergeConversation,
} from './conversation-merge.policy';

export interface ConversationListPage {
  items: Conversation[];
  nextCursor?: number;
}

function createEmptyListData(): InfiniteData<ConversationListPage, number> {
  return {
    pages: [{ items: [], nextCursor: undefined }],
    pageParams: [1],
  };
}

function dedupeConversations(conversations: Conversation[]): Conversation[] {
  const seen = new Set<string>();

  return conversations.filter((conversation) => {
    if (seen.has(conversation.id)) {
      return false;
    }

    seen.add(conversation.id);
    return true;
  });
}

function normalizePageParams(
  pageParams: number[],
  pageCount: number,
): number[] {
  if (pageParams.length === 0) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const normalized = [...pageParams];
  while (normalized.length < pageCount) {
    const last = normalized[normalized.length - 1];
    normalized.push(last + 1);
  }

  return normalized.slice(0, pageCount);
}

function rebuildInfiniteData(
  oldData: InfiniteData<ConversationListPage, number> | undefined,
  nextItems: Conversation[],
): InfiniteData<ConversationListPage, number> {
  const existing = oldData ?? createEmptyListData();
  const pageCount = Math.max(
    1,
    existing.pages.length,
    existing.pageParams.length,
  );
  const originalPageSizes = existing.pages.map((page) => page.items.length);

  const pages: ConversationListPage[] = [];
  let cursor = 0;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const remaining = Math.max(0, nextItems.length - cursor);
    const take =
      pageIndex < pageCount - 1
        ? Math.min(originalPageSizes[pageIndex] ?? 0, remaining)
        : remaining;

    pages.push({
      items: nextItems.slice(cursor, cursor + take),
      nextCursor: existing.pages[pageIndex]?.nextCursor,
    });

    cursor += take;
  }

  return {
    pages,
    pageParams: normalizePageParams(existing.pageParams, pageCount),
  };
}

// biome-ignore lint/complexity/noStaticOnlyClass: static cache service is intentional
export class ConversationAuthoritativeCacheService {
  static getListData(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): InfiniteData<ConversationListPage, number> | undefined {
    return queryClient.getQueryData<InfiniteData<ConversationListPage, number>>(
      queryKeys.conversations.list(channel),
    );
  }

  static updatePages(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    updater: (conversations: Conversation[]) => Conversation[],
  ): void {
    queryClient.setQueryData<InfiniteData<ConversationListPage, number>>(
      queryKeys.conversations.list(channel),
      (old) => {
        const existing = old ?? createEmptyListData();
        const flatConversations = dedupeConversations(
          existing.pages.flatMap((page) => page.items ?? []),
        );
        const nextItems = dedupeConversations(updater(flatConversations));

        return rebuildInfiniteData(existing, nextItems);
      },
    );
  }

  static syncConversationDetail(
    queryClient: QueryClient,
    conversation: Conversation,
    source: ConversationMergeSource,
    options?: ConversationMergeOptions,
  ): Conversation {
    const currentConversation = queryClient.getQueryData<Conversation>(
      queryKeys.conversations.detail(conversation.id),
    );
    const nextConversation = currentConversation
      ? mergeConversation(currentConversation, conversation, source, options)
      : conversation;

    queryClient.setQueryData(
      queryKeys.conversations.detail(conversation.id),
      nextConversation,
    );

    return nextConversation;
  }

  static upsertConversation(
    queryClient: QueryClient,
    conversation: Conversation,
    channel: ChannelTypeEnum,
    source: ConversationMergeSource,
    options?: ConversationMergeOptions & { moveToTop?: boolean },
  ): Conversation {
    let nextConversation = conversation;
    const shouldMoveToTop = options?.moveToTop !== false;

    ConversationAuthoritativeCacheService.updatePages(
      queryClient,
      channel,
      (conversations) => {
        const existingIndex = conversations.findIndex(
          (item) => item.id === conversation.id,
        );
        const existingConversation =
          existingIndex >= 0 ? conversations[existingIndex] : undefined;

        nextConversation = existingConversation
          ? mergeConversation(
              existingConversation,
              conversation,
              source,
              options,
            )
          : conversation;

        if (existingIndex >= 0) {
          if (shouldMoveToTop) {
            return [
              nextConversation,
              ...conversations.filter((item) => item.id !== conversation.id),
            ];
          }

          const updated = [...conversations];
          updated[existingIndex] = nextConversation;
          return updated;
        }

        return [nextConversation, ...conversations];
      },
    );

    return ConversationAuthoritativeCacheService.syncConversationDetail(
      queryClient,
      nextConversation,
      source,
      options,
    );
  }

  static replaceFirstPageSnapshot(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    conversations: Conversation[],
  ): Conversation[] {
    const currentListData = ConversationAuthoritativeCacheService.getListData(
      queryClient,
      channel,
    );
    const pageParam = currentListData?.pageParams[0] ?? 1;

    queryClient.setQueryData<InfiniteData<ConversationListPage, number>>(
      queryKeys.conversations.list(channel),
      {
        pages: [
          {
            items: conversations,
            nextCursor: undefined,
          },
        ],
        pageParams: [pageParam],
      },
    );

    return conversations;
  }

  static replaceConversationList(
    queryClient: QueryClient,
    conversations: Conversation[],
    channel: ChannelTypeEnum,
    source: ConversationMergeSource = 'authoritative-list',
  ): Conversation[] {
    ConversationAuthoritativeCacheService.replaceFirstPageSnapshot(
      queryClient,
      channel,
      conversations,
    );

    for (const conversation of conversations) {
      ConversationAuthoritativeCacheService.syncConversationDetail(
        queryClient,
        conversation,
        source,
      );
    }

    return conversations;
  }
}
