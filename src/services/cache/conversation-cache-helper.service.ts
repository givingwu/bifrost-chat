import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import {
  AvailableChannels,
  type ChannelTypeEnum,
} from '@/interfaces/channel.interface';
import {
  type Conversation,
  ConversationStatusEnum,
  type User,
} from '@/interfaces/conversation.interface';
import {
  MessageDirectionEnum,
  type MessageParticipant,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';

const PREVIEW_FALLBACK_BY_TYPE: Record<MessageTypeEnum, string> = {
  [MessageTypeEnum.Text]: '[text]',
  [MessageTypeEnum.Image]: '[image]',
  [MessageTypeEnum.Audio]: '[audio]',
  [MessageTypeEnum.Video]: '[video]',
  [MessageTypeEnum.File]: '[file]',
  [MessageTypeEnum.Template]: '[template]',
  [MessageTypeEnum.Location]: '[location]',
  [MessageTypeEnum.RichMedia]: '[rich media]',
  [MessageTypeEnum.Other]: '[message]',
};

const COMMON_NAME_KEYS = [
  'customerName',
  'contactName',
  'displayName',
  'userName',
  'name',
] as const;
const INCOMING_NAME_KEYS = ['senderName', 'fromName'] as const;
const OUTGOING_NAME_KEYS = ['receiverName', 'toName'] as const;

const COMMON_AVATAR_KEYS = [
  'avatarUrl',
  'avatar',
  'customerAvatarUrl',
  'contactAvatarUrl',
] as const;
const INCOMING_AVATAR_KEYS = ['senderAvatarUrl', 'fromAvatarUrl'] as const;
const OUTGOING_AVATAR_KEYS = ['receiverAvatarUrl', 'toAvatarUrl'] as const;
const PENDING_CREATE_LOCAL_STATE = 'pending_create' as const;
const PENDING_CREATE_SOURCE = 'create' as const;

type PendingConversationMetadata = Record<string, unknown> & {
  localState?: typeof PENDING_CREATE_LOCAL_STATE;
  pendingSince?: string;
  pendingSource?: typeof PENDING_CREATE_SOURCE;
};

function pickMetadataString(
  metadata: Record<string, unknown> | undefined,
  keys: readonly string[],
): string | undefined {
  if (!metadata) {
    return undefined;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

function normalizePreviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getPeerParticipant(message: StandardMessage): MessageParticipant {
  return message.direction === MessageDirectionEnum.Outgoing
    ? message.receiver
    : message.sender;
}

function getPreviewText(message: StandardMessage): string {
  const content = message.content as Partial<
    Record<'text' | 'address' | 'desc', unknown>
  >;

  const candidates = [content.text, content.address, content.desc];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const normalized = normalizePreviewText(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  return PREVIEW_FALLBACK_BY_TYPE[message.type] ?? '[message]';
}

function buildSyntheticUser(message: StandardMessage): User {
  const peer = getPeerParticipant(message);
  const metadata = message.metadata;
  const directionalNameKeys =
    message.direction === MessageDirectionEnum.Outgoing
      ? OUTGOING_NAME_KEYS
      : INCOMING_NAME_KEYS;
  const directionalAvatarKeys =
    message.direction === MessageDirectionEnum.Outgoing
      ? OUTGOING_AVATAR_KEYS
      : INCOMING_AVATAR_KEYS;

  const name =
    pickMetadataString(metadata, directionalNameKeys) ??
    pickMetadataString(metadata, COMMON_NAME_KEYS) ??
    peer.pin;

  const avatarUrl =
    pickMetadataString(metadata, directionalAvatarKeys) ??
    pickMetadataString(metadata, COMMON_AVATAR_KEYS);

  return {
    id: peer.pin,
    name,
    avatarUrl,
    status: AgentStatusEnum.Offline,
    email: looksLikeEmail(peer.pin) ? peer.pin : undefined,
    phone: looksLikeEmail(peer.pin) ? undefined : peer.pin,
  };
}

function mergeUser(existingUser: User, incomingUser: User): User {
  const shouldUseIncomingName =
    !existingUser.name || existingUser.name === existingUser.id;

  return {
    ...existingUser,
    ...incomingUser,
    id: existingUser.id || incomingUser.id,
    name: shouldUseIncomingName ? incomingUser.name : existingUser.name,
    avatarUrl: existingUser.avatarUrl || incomingUser.avatarUrl,
    status: existingUser.status ?? incomingUser.status,
    email: existingUser.email || incomingUser.email,
    phone: existingUser.phone || incomingUser.phone,
    role: existingUser.role || incomingUser.role,
    tags: existingUser.tags?.length ? existingUser.tags : incomingUser.tags,
  };
}

function mergeSupportedChannels(
  existingChannels?: ChannelTypeEnum[],
  incomingChannels?: ChannelTypeEnum[],
): ChannelTypeEnum[] | undefined {
  const merged = [
    ...(existingChannels ?? []),
    ...(incomingChannels ?? []),
  ] as ChannelTypeEnum[];

  if (merged.length === 0) {
    return undefined;
  }

  return [...new Set(merged)];
}

function isMetadataRecord(
  metadata: Conversation['metadata'],
): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null;
}

function toPendingConversation(conversation: Conversation): Conversation {
  const metadata: PendingConversationMetadata = isMetadataRecord(
    conversation.metadata,
  )
    ? { ...conversation.metadata }
    : {};

  return {
    ...conversation,
    metadata: {
      ...metadata,
      localState: PENDING_CREATE_LOCAL_STATE,
      pendingSince:
        typeof metadata.pendingSince === 'string'
          ? metadata.pendingSince
          : new Date().toISOString(),
      pendingSource: PENDING_CREATE_SOURCE,
    },
  };
}

function mergePendingConversations(
  serverConversations: Conversation[],
  pendingConversations: Conversation[],
): Conversation[] {
  if (pendingConversations.length === 0) {
    return serverConversations;
  }

  const serverConversationIds = new Set(
    serverConversations.map((conversation) => conversation.id),
  );
  const visiblePendingConversations = pendingConversations.filter(
    (conversation) => !serverConversationIds.has(conversation.id),
  );

  return [...visiblePendingConversations, ...serverConversations];
}

function mergeConversation(
  existingConversation: Conversation,
  incomingConversation: Conversation,
  options?: {
    preserveUnreadCount?: boolean;
  },
): Conversation {
  const existingMetadata = existingConversation.metadata;
  const mergedMetadata =
    existingMetadata &&
    typeof existingMetadata === 'object' &&
    existingMetadata.synthetic !== true
      ? existingMetadata
      : {
          ...incomingConversation.metadata,
          ...existingConversation.metadata,
        };

  return {
    ...existingConversation,
    ...incomingConversation,
    user: mergeUser(existingConversation.user, incomingConversation.user),
    unreadCount: options?.preserveUnreadCount
      ? (existingConversation.unreadCount ?? incomingConversation.unreadCount)
      : incomingConversation.unreadCount,
    isActive: existingConversation.isActive,
    status: existingConversation.status ?? incomingConversation.status,
    priority: existingConversation.priority ?? incomingConversation.priority,
    createdAt: existingConversation.createdAt ?? incomingConversation.createdAt,
    updatedAt: incomingConversation.updatedAt ?? existingConversation.updatedAt,
    metadata: mergedMetadata,
    supportedChannels: mergeSupportedChannels(
      existingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
      incomingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
    ),
  };
}

// biome-ignore lint/complexity/noStaticOnlyClass: cache helper uses a static utility style
export class ConversationCacheHelper {
  // ==================== 内部辅助 ====================

  /**
   * 读取 InfiniteQuery 缓存并展平为会话数组
   */
  private static getPages(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): InfiniteData<Conversation[], number> | undefined {
    return queryClient.getQueryData<InfiniteData<Conversation[], number>>(
      queryKeys.conversations.list(channel),
    );
  }

  /**
   * 以 updater 函数更新所有 pages 内的会话，写回 InfiniteQuery 缓存
   */
  private static updatePages(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    updater: (conversations: Conversation[]) => Conversation[],
  ): void {
    queryClient.setQueryData<InfiniteData<Conversation[], number>>(
      queryKeys.conversations.list(channel),
      (old) => {
        // 缓存不存在时初始化（新建陌生会话场景）
        const existing = old ?? { pages: [[]], pageParams: [1] };
        return { ...existing, pages: existing.pages.map(updater) };
      },
    );
  }

  private static updatePendingConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    updater: (conversations: Conversation[]) => Conversation[],
  ): void {
    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.pending(channel),
      (old) => {
        const existing = old ?? [];
        return updater(existing);
      },
    );
  }

  // ==================== 公共接口 ====================

  static getConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    const data = ConversationCacheHelper.getPages(queryClient, channel);
    return data?.pages.flat() ?? [];
  }

  static getPendingConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    return (
      queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.pending(channel),
      ) ?? []
    );
  }

  static getMergedConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    return mergePendingConversations(
      ConversationCacheHelper.getConversations(queryClient, channel),
      ConversationCacheHelper.getPendingConversations(queryClient, channel),
    );
  }

  /**
   * 获取单个会话详情缓存。
   *
   * @param queryClient React Query 客户端
   * @param conversationId 会话 ID
   * @returns 缓存中的完整会话，未命中返回 undefined
   */
  static getConversationDetail(
    queryClient: QueryClient,
    conversationId: string,
  ): Conversation | undefined {
    return queryClient.getQueryData<Conversation>(
      queryKeys.conversations.detail(conversationId),
    );
  }

  /**
   * 在详情缓存与各渠道列表缓存中查找单个会话。
   *
   * @param queryClient React Query 客户端
   * @param conversationId 会话 ID
   * @returns 命中的会话，未命中返回 undefined
   */
  static findConversation(
    queryClient: QueryClient,
    conversationId: string,
  ): Conversation | undefined {
    const cachedDetail = ConversationCacheHelper.getConversationDetail(
      queryClient,
      conversationId,
    );

    if (cachedDetail) {
      return cachedDetail;
    }

    for (const channel of AvailableChannels) {
      const conversation = ConversationCacheHelper.getMergedConversations(
        queryClient,
        channel,
      ).find((item) => item.id === conversationId);

      if (conversation) {
        return conversation;
      }
    }

    return undefined;
  }

  /**
   * 写入单个会话详情缓存。
   *
   * @param queryClient React Query 客户端
   * @param conversation 会话详情
   * @returns 合并后的会话详情
   */
  static setConversationDetail(
    queryClient: QueryClient,
    conversation: Conversation,
  ): Conversation {
    const currentConversation = ConversationCacheHelper.getConversationDetail(
      queryClient,
      conversation.id,
    );
    const nextConversation = currentConversation
      ? mergeConversation(currentConversation, conversation)
      : conversation;

    queryClient.setQueryData(
      queryKeys.conversations.detail(conversation.id),
      nextConversation,
    );

    return nextConversation;
  }

  /**
   * 将完整会话详情同时写回详情缓存和对应渠道列表缓存。
   *
   * @param queryClient React Query 客户端
   * @param conversation 会话详情
   * @returns 合并后的会话详情
   */
  static cacheConversation(
    queryClient: QueryClient,
    conversation: Conversation,
  ): Conversation {
    const nextConversation = ConversationCacheHelper.upsertConversation(
      queryClient,
      conversation,
      conversation.channel,
      { moveToTop: false }, // 点击切换会话时不置顶
    );

    return ConversationCacheHelper.setConversationDetail(
      queryClient,
      nextConversation,
    );
  }

  static buildSyntheticConversation(message: StandardMessage): Conversation {
    const peer = getPeerParticipant(message);
    const isoTimestamp = new Date(message.timestamp).toISOString();

    return {
      id: message.conversationId,
      user: buildSyntheticUser(message),
      lastMessage: getPreviewText(message),
      lastMessageTime: isoTimestamp,
      unreadCount: 0,
      channel: message.channelType,
      isActive: false,
      status: ConversationStatusEnum.Active,
      createdAt: isoTimestamp,
      updatedAt: isoTimestamp,
      supportedChannels: [message.channelType],
      metadata: {
        synthetic: true,
        source: 'websocket',
        seedMessageId: message.id,
        peerApp: peer.app,
        peerPin: peer.pin,
      },
    };
  }

  static upsertConversation(
    queryClient: QueryClient,
    conversation: Conversation,
    channel: ChannelTypeEnum,
    options?: {
      preserveUnreadCount?: boolean;
      /**
       * 是否将会话移动到列表顶部
       * - true（默认）：已有会话更新后移动到顶部（收到新消息场景）
       * - false：已有会话保持原位置（点击切换会话场景）
       * - 新会话始终添加到顶部
       */
      moveToTop?: boolean;
    },
  ): Conversation {
    ConversationCacheHelper.confirmPendingConversation(
      queryClient,
      conversation.id,
      channel,
    );

    let nextConversation = conversation;
    const shouldMoveToTop = options?.moveToTop !== false;

    ConversationCacheHelper.updatePages(
      queryClient,
      channel,
      (conversations) => {
        const existingIndex = conversations.findIndex(
          (item) => item.id === conversation.id,
        );
        const existingConversation =
          existingIndex >= 0 ? conversations[existingIndex] : undefined;

        nextConversation = existingConversation
          ? mergeConversation(existingConversation, conversation, options)
          : conversation;

        if (existingIndex >= 0) {
          // 已有会话
          if (shouldMoveToTop) {
            // 移动到顶部（收到新消息场景）
            const rest = conversations.filter(
              (item) => item.id !== conversation.id,
            );
            return [nextConversation, ...rest];
          }
          // 保持原位置，只更新内容（点击切换会话场景）
          const updated = [...conversations];
          updated[existingIndex] = nextConversation;
          return updated;
        }

        // 新会话：添加到最前面（置顶）
        return [nextConversation, ...conversations];
      },
    );

    return ConversationCacheHelper.setConversationDetail(
      queryClient,
      nextConversation,
    );
  }

  static upsertPendingConversation(
    queryClient: QueryClient,
    conversation: Conversation,
    channel: ChannelTypeEnum,
  ): Conversation {
    const nextPendingConversation = toPendingConversation(conversation);
    let nextConversation = nextPendingConversation;

    ConversationCacheHelper.updatePendingConversations(
      queryClient,
      channel,
      (conversations) => {
        const existingConversation = conversations.find(
          (item) => item.id === conversation.id,
        );

        nextConversation = existingConversation
          ? mergeConversation(existingConversation, nextPendingConversation, {
              preserveUnreadCount: true,
            })
          : nextPendingConversation;

        const rest = conversations.filter(
          (item) => item.id !== conversation.id,
        );

        return [nextConversation, ...rest];
      },
    );

    return ConversationCacheHelper.setConversationDetail(
      queryClient,
      nextConversation,
    );
  }

  static confirmPendingConversation(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    let removedConversation: Conversation | undefined;

    ConversationCacheHelper.updatePendingConversations(
      queryClient,
      channel,
      (conversations) => {
        const rest = conversations.filter((conversation) => {
          const isMatch = conversation.id === conversationId;
          if (isMatch) {
            removedConversation = conversation;
          }
          return !isMatch;
        });

        return removedConversation ? rest : conversations;
      },
    );

    return removedConversation;
  }

  static confirmPendingConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    conversationIds: string[],
  ): void {
    if (conversationIds.length === 0) {
      return;
    }

    const confirmedConversationIds = new Set(conversationIds);

    ConversationCacheHelper.updatePendingConversations(
      queryClient,
      channel,
      (conversations) => {
        const rest = conversations.filter(
          (conversation) => !confirmedConversationIds.has(conversation.id),
        );

        return rest.length === conversations.length ? conversations : rest;
      },
    );
  }

  static mergeConversationsWithPending(
    conversations: Conversation[],
    pendingConversations: Conversation[],
  ): Conversation[] {
    return mergePendingConversations(conversations, pendingConversations);
  }

  static upsertConversationFromMessage(
    queryClient: QueryClient,
    message: StandardMessage,
    options?: {
      preserveUnreadCount?: boolean;
    },
  ): Conversation {
    const syntheticConversation =
      ConversationCacheHelper.buildSyntheticConversation(message);

    return ConversationCacheHelper.upsertConversation(
      queryClient,
      syntheticConversation,
      message.channelType,
      { preserveUnreadCount: options?.preserveUnreadCount ?? true },
    );
  }

  static replaceConversationList(
    queryClient: QueryClient,
    conversations: Conversation[],
    channel: ChannelTypeEnum,
  ): Conversation[] {
    ConversationCacheHelper.confirmPendingConversations(
      queryClient,
      channel,
      conversations.map((conversation) => conversation.id),
    );

    // 将整个列表写入第一页，保留 pageParams 结构
    queryClient.setQueryData<InfiniteData<Conversation[], number>>(
      queryKeys.conversations.list(channel),
      (old) => ({
        pages: [conversations],
        pageParams: old?.pageParams ?? [1],
      }),
    );

    for (const conversation of conversations) {
      ConversationCacheHelper.setConversationDetail(queryClient, conversation);
    }

    return conversations;
  }

  static replaceConversation(
    queryClient: QueryClient,
    conversation: Conversation,
    channel: ChannelTypeEnum,
  ): Conversation {
    return ConversationCacheHelper.upsertConversation(
      queryClient,
      conversation,
      channel,
    );
  }

  static incrementUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    let nextConversation: Conversation | undefined;

    ConversationCacheHelper.updatePages(queryClient, channel, (conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        nextConversation = {
          ...conversation,
          unreadCount: conversation.unreadCount + 1,
        };
        return nextConversation;
      }),
    );

    if (nextConversation) {
      ConversationCacheHelper.setConversationDetail(
        queryClient,
        nextConversation,
      );
    }

    return nextConversation;
  }

  /**
   * 更新会话摘要（lastMessage / lastMessageTime）并置顶
   */
  static updateConversationSummary(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
    message: StandardMessage,
  ): Conversation | undefined {
    let updatedConversation: Conversation | undefined;

    ConversationCacheHelper.updatePages(
      queryClient,
      channel,
      (conversations) => {
        const targetIndex = conversations.findIndex(
          (conversation) => conversation.id === conversationId,
        );

        if (targetIndex === -1) return conversations;

        const target = conversations[targetIndex];
        updatedConversation = {
          ...target,
          lastMessage: getPreviewText(message),
          lastMessageTime: new Date(message.timestamp).toISOString(),
        };

        // 将更新后的会话移到列表顶部
        const rest = conversations.filter((_, index) => index !== targetIndex);
        return [updatedConversation, ...rest];
      },
    );

    if (updatedConversation) {
      ConversationCacheHelper.setConversationDetail(
        queryClient,
        updatedConversation,
      );
    }

    return updatedConversation;
  }

  /**
   * 单个会话未读数 -amount，最小为 0
   */
  static decrementUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
    amount = 1,
  ): Conversation | undefined {
    let nextConversation: Conversation | undefined;

    ConversationCacheHelper.updatePages(queryClient, channel, (conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        nextConversation = {
          ...conversation,
          unreadCount: Math.max(0, conversation.unreadCount - amount),
        };
        return nextConversation;
      }),
    );

    if (nextConversation) {
      ConversationCacheHelper.setConversationDetail(
        queryClient,
        nextConversation,
      );
    }

    return nextConversation;
  }

  static clearUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    let nextConversation: Conversation | undefined;

    ConversationCacheHelper.updatePages(queryClient, channel, (conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        nextConversation = { ...conversation, unreadCount: 0 };
        return nextConversation;
      }),
    );

    if (nextConversation) {
      ConversationCacheHelper.setConversationDetail(
        queryClient,
        nextConversation,
      );
    }

    return nextConversation;
  }

  /**
   * 设置单个会话的精确未读数
   */
  static setExactUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
    count: number,
  ): Conversation | undefined {
    let nextConversation: Conversation | undefined;

    ConversationCacheHelper.updatePages(queryClient, channel, (conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        nextConversation = { ...conversation, unreadCount: Math.max(0, count) };
        return nextConversation;
      }),
    );

    if (nextConversation) {
      ConversationCacheHelper.setConversationDetail(
        queryClient,
        nextConversation,
      );
    }

    return nextConversation;
  }
}
