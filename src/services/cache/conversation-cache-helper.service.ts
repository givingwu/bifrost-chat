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

// ============================================================================
// Constants
// ============================================================================

/**
 * Fallback preview text for each message type when content is unavailable.
 * Used for conversation list preview display.
 */
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
} as const;

/**
 * Metadata keys for extracting user name from message metadata.
 * Priority: directional keys > common keys
 */
const METADATA_NAME_KEYS = {
  common: ['customerName', 'contactName', 'displayName', 'userName', 'name'],
  incoming: ['senderName', 'fromName'],
  outgoing: ['receiverName', 'toName'],
} as const;

/**
 * Metadata keys for extracting user avatar URL from message metadata.
 * Priority: directional keys > common keys
 */
const METADATA_AVATAR_KEYS = {
  common: ['avatarUrl', 'avatar', 'customerAvatarUrl', 'contactAvatarUrl'],
  incoming: ['senderAvatarUrl', 'fromAvatarUrl'],
  outgoing: ['receiverAvatarUrl', 'toAvatarUrl'],
} as const;

/**
 * Pending conversation state constants
 */
const PENDING_STATE = {
  localState: 'pending_create',
  source: 'create',
} as const;

// ============================================================================
// Types
// ============================================================================

/**
 * Metadata structure for pending conversations that haven't been confirmed by server.
 */
type PendingConversationMetadata = Record<string, unknown> & {
  localState?: typeof PENDING_STATE.localState;
  pendingSince?: string;
  pendingSource?: typeof PENDING_STATE.source;
};

/**
 * Options for conversation merge operations
 */
interface MergeOptions {
  /** Whether to preserve the existing unread count */
  preserveUnreadCount?: boolean;
}

/**
 * Options for upsert conversation operations
 */
interface UpsertOptions extends MergeOptions {
  /**
   * Whether to move the conversation to the top of the list
   * - true (default): Move to top after update (e.g., new message received)
   * - false: Keep original position (e.g., conversation switch)
   * - New conversations are always added to the top
   */
  moveToTop?: boolean;
}

/**
 * Result type for update operations that may or may not find the target
 */
type UpdateResult<T> = {
  data: T;
  found: boolean;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Picks the first non-empty string value from metadata using provided keys.
 *
 * @param metadata - The metadata object to search
 * @param keys - Keys to check in priority order
 * @returns The first non-empty trimmed string, or undefined if not found
 */
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

/**
 * Checks if a string looks like an email address.
 * Uses simple heuristic: contains '@' character.
 *
 * @param value - The string to check
 * @returns true if the value appears to be an email
 */
function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

/**
 * Normalizes preview text by collapsing whitespace and trimming.
 *
 * @param value - The text to normalize
 * @returns Normalized text with single spaces
 */
function normalizePreviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Gets the peer participant from a message based on direction.
 * For incoming messages, returns sender; for outgoing, returns receiver.
 *
 * @param message - The message to extract peer from
 * @returns The peer participant
 */
function getPeerParticipant(message: StandardMessage): MessageParticipant {
  return message.direction === MessageDirectionEnum.Outgoing
    ? message.receiver
    : message.sender;
}

/**
 * Extracts preview text from a message for conversation list display.
 * Tries text, address, and desc fields in order, falling back to type-based placeholder.
 *
 * @param message - The message to extract preview from
 * @returns Preview text for display
 */
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

/**
 * Builds a synthetic User object from a message for conversation preview.
 * Extracts name and avatar from metadata with directional priority.
 *
 * @param message - The message to build user from
 * @returns A synthetic User object
 */
function buildSyntheticUser(message: StandardMessage): User {
  const peer = getPeerParticipant(message);
  const metadata = message.metadata;
  const isOutgoing = message.direction === MessageDirectionEnum.Outgoing;

  const directionalNameKeys = isOutgoing
    ? METADATA_NAME_KEYS.outgoing
    : METADATA_NAME_KEYS.incoming;
  const directionalAvatarKeys = isOutgoing
    ? METADATA_AVATAR_KEYS.outgoing
    : METADATA_AVATAR_KEYS.incoming;

  const name =
    pickMetadataString(metadata, directionalNameKeys) ??
    pickMetadataString(metadata, METADATA_NAME_KEYS.common) ??
    peer.pin;

  const avatarUrl =
    pickMetadataString(metadata, directionalAvatarKeys) ??
    pickMetadataString(metadata, METADATA_AVATAR_KEYS.common);

  const isEmail = looksLikeEmail(peer.pin);

  return {
    id: peer.pin,
    name,
    avatarUrl,
    status: AgentStatusEnum.Offline,
    email: isEmail ? peer.pin : undefined,
    phone: isEmail ? undefined : peer.pin,
  };
}

// ============================================================================
// Merge Functions
// ============================================================================

/**
 * Merges two User objects with smart field selection.
 * Prefers existing non-default values over incoming values.
 *
 * @param existingUser - The current user data
 * @param incomingUser - The new user data
 * @returns Merged user with best available fields
 */
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

/**
 * Merges two channel arrays with deduplication.
 *
 * @param existingChannels - Current supported channels
 * @param incomingChannels - New supported channels
 * @returns Deduplicated merged channels, or undefined if both empty
 */
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

/**
 * Type guard to check if metadata is a valid record object.
 *
 * @param metadata - The metadata to check
 * @returns true if metadata is a non-null object
 */
function isMetadataRecord(
  metadata: Conversation['metadata'],
): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null;
}

/**
 * Converts a conversation to pending state with appropriate metadata.
 *
 * @param conversation - The conversation to convert
 * @returns Conversation with pending state metadata
 */
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
      localState: PENDING_STATE.localState,
      pendingSince:
        typeof metadata.pendingSince === 'string'
          ? metadata.pendingSince
          : new Date().toISOString(),
      pendingSource: PENDING_STATE.source,
    },
  };
}

/**
 * Merges pending conversations with server conversations.
 * Filters out pending conversations that already exist in server list.
 *
 * @param serverConversations - Conversations from server
 * @param pendingConversations - Local pending conversations
 * @returns Combined list with pending conversations prepended
 */
function mergePendingConversations(
  pendingConversations: Conversation[],
  serverConversations: Conversation[],
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

/**
 * Merges two conversation objects with smart field selection.
 * Preserves existing data when incoming has empty/zero placeholder values.
 *
 * @param existingConversation - The current conversation data
 * @param incomingConversation - The new conversation data
 * @param options - Merge options
 * @returns Merged conversation with best available fields
 */
function mergeConversation(
  existingConversation: Conversation,
  incomingConversation: Conversation,
  options?: MergeOptions,
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

  // Summary fields: preserve existing data when incoming is empty/zero.
  // GET endpoints (e.g., /session/info) may not include message summaries,
  // using empty placeholder values - these should not overwrite list data.
  const shouldPreserveUnread =
    options?.preserveUnreadCount ||
    (incomingConversation.unreadCount === 0 &&
      existingConversation.unreadCount > 0);

  return {
    ...existingConversation,
    ...incomingConversation,
    user: mergeUser(existingConversation.user, incomingConversation.user),
    lastMessage:
      incomingConversation.lastMessage || existingConversation.lastMessage,
    lastMessageTime:
      incomingConversation.lastMessageTime ||
      existingConversation.lastMessageTime,
    unreadCount: shouldPreserveUnread
      ? (existingConversation.unreadCount ?? incomingConversation.unreadCount)
      : incomingConversation.unreadCount,
    isActive: existingConversation.isActive,
    status: incomingConversation.status ?? existingConversation.status,
    priority: incomingConversation.priority ?? existingConversation.priority,
    createdAt: existingConversation.createdAt ?? incomingConversation.createdAt,
    updatedAt: incomingConversation.updatedAt ?? existingConversation.updatedAt,
    metadata: mergedMetadata,
    supportedChannels: mergeSupportedChannels(
      incomingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
      existingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
    ),
  };
}

// ============================================================================
// Cache Helper Class
// ============================================================================

/**
 * Helper class for managing conversation cache operations.
 * Provides atomic, type-safe operations for React Query cache manipulation.
 *
 * Design Notes:
 * - Uses static methods for utility-style access without instantiation
 * - All operations are atomic and maintain cache consistency
 * - Supports both infinite query (list) and single item (detail) caches
 */
// biome-ignore lint/complexity/noStaticOnlyClass: cache helper uses a static utility style
export class ConversationCacheHelper {
  // ==================== Private Cache Accessors ====================

  /**
   * Reads the infinite query cache for a channel's conversation list.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to get conversations for
   * @returns The infinite query data or undefined if not cached
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
   * Updates all pages in the infinite query cache using an updater function.
   * Initializes cache if it doesn't exist (for new conversation scenarios).
   *
   * @param queryClient - React Query client
   * @param channel - Channel to update
   * @param updater - Function to transform conversations in each page
   */
  private static updatePages(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    updater: (conversations: Conversation[]) => Conversation[],
  ): void {
    queryClient.setQueryData<InfiniteData<Conversation[], number>>(
      queryKeys.conversations.list(channel),
      (old) => {
        const existing = old ?? { pages: [[]], pageParams: [1] };
        return { ...existing, pages: existing.pages.map(updater) };
      },
    );
  }

  /**
   * Updates the pending conversations cache using an updater function.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to update
   * @param updater - Function to transform pending conversations
   */
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

  /**
   * Helper to update a single conversation's unread count in the list.
   * Returns the updated conversation if found.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to update
   * @param conversationId - ID of conversation to update
   * @param updater - Function to compute new unread count
   * @returns Update result with data and found status
   */
  private static updateUnreadCount(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
    conversationId: string,
    updater: (currentCount: number) => number,
  ): UpdateResult<Conversation | undefined> {
    let nextConversation: Conversation | undefined;
    let found = false;

    ConversationCacheHelper.updatePages(queryClient, channel, (conversations) =>
      conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        found = true;
        nextConversation = {
          ...conversation,
          unreadCount: updater(conversation.unreadCount),
        };

        return nextConversation;
      }),
    );

    return { data: nextConversation, found };
  }

  /**
   * Syncs a conversation update to the detail cache.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to sync, or undefined
   * @returns The synced conversation or undefined
   */
  private static syncToDetailCache(
    queryClient: QueryClient,
    conversation: Conversation | undefined,
  ): Conversation | undefined {
    if (conversation) {
      ConversationCacheHelper.setConversationDetail(queryClient, conversation);
    }
    return conversation;
  }

  // ==================== Public Read Operations ====================

  /**
   * Gets all cached conversations for a channel (server data only).
   *
   * @param queryClient - React Query client
   * @param channel - Channel to get conversations for
   * @returns Flattened array of all cached conversations
   */
  static getConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    const data = ConversationCacheHelper.getPages(queryClient, channel);
    return data?.pages.flat() ?? [];
  }

  /**
   * Gets all pending conversations for a channel.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to get pending conversations for
   * @returns Array of pending conversations
   */
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

  /**
   * Gets merged conversations (pending + server) for display.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to get conversations for
   * @returns Combined array with pending conversations prepended
   */
  static getMergedConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    return mergePendingConversations(
      ConversationCacheHelper.getPendingConversations(queryClient, channel),
      ConversationCacheHelper.getConversations(queryClient, channel),
    );
  }

  /**
   * Gets a single conversation from the detail cache.
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation ID to look up
   * @returns Cached conversation or undefined if not found
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
   * Finds a conversation across all caches (detail + all channel lists).
   * Checks detail cache first, then searches each channel's list.
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation ID to find
   * @returns Found conversation or undefined
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

  // ==================== Public Write Operations ====================

  /**
   * Writes a conversation to the detail cache with merge logic.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to cache
   * @returns Merged conversation after caching
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
   * Caches a conversation to both detail and list caches.
   * Use for full conversation data that should be synced everywhere.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to cache
   * @returns Merged conversation after caching
   */
  static cacheConversation(
    queryClient: QueryClient,
    conversation: Conversation,
  ): Conversation {
    const nextConversation = ConversationCacheHelper.upsertConversation(
      queryClient,
      conversation,
      conversation.channel,
      { moveToTop: false }, // Don't move to top on conversation switch
    );

    return ConversationCacheHelper.setConversationDetail(
      queryClient,
      nextConversation,
    );
  }

  /**
   * Builds a synthetic conversation from a message for optimistic updates.
   * Used when a message arrives for a conversation not yet in cache.
   *
   * @param message - Message to build conversation from
   * @returns Synthetic conversation object
   */
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

  /**
   * Upserts a conversation to the list and detail caches.
   * Handles pending conversation confirmation automatically.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to upsert
   * @param channel - Channel to upsert to
   * @param options - Upsert options
   * @returns Merged conversation after upsert
   */
  static upsertConversation(
    queryClient: QueryClient,
    conversation: Conversation,
    channel: ChannelTypeEnum,
    options?: UpsertOptions,
  ): Conversation {
    // First, remove from pending if this is a confirmation
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
          // Existing conversation
          if (shouldMoveToTop) {
            // Move to top (new message scenario)
            const rest = conversations.filter(
              (item) => item.id !== conversation.id,
            );
            return [nextConversation, ...rest];
          }

          // Keep position, just update content (conversation switch scenario)
          const updated = [...conversations];
          updated[existingIndex] = nextConversation;

          return updated;
        }

        // New conversation: add to front
        return [nextConversation, ...conversations];
      },
    );

    return ConversationCacheHelper.setConversationDetail(
      queryClient,
      nextConversation,
    );
  }

  /**
   * Adds or updates a conversation in the pending cache.
   * Used for optimistic updates before server confirmation.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to add as pending
   * @param channel - Channel to add to
   * @returns The pending conversation with metadata
   */
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

  /**
   * Removes a conversation from the pending cache.
   * Called when a pending conversation is confirmed by the server.
   *
   * @param queryClient - React Query client
   * @param conversationId - ID of conversation to confirm
   * @param channel - Channel to remove from
   * @returns The removed conversation, or undefined if not found
   */
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

  /**
   * Removes multiple conversations from the pending cache.
   * More efficient than calling confirmPendingConversation multiple times.
   *
   * @param queryClient - React Query client
   * @param channel - Channel to remove from
   * @param conversationIds - IDs of conversations to confirm
   */
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

  /**
   * Merges pending conversations with server conversations.
   * Standalone function version of the merge logic.
   *
   * @param conversations - Server conversations
   * @param pendingConversations - Pending conversations
   * @returns Merged conversation list
   */
  static mergeConversationsWithPending(
    conversations: Conversation[],
    pendingConversations: Conversation[],
  ): Conversation[] {
    return mergePendingConversations(pendingConversations, conversations);
  }

  /**
   * Creates or updates a conversation from an incoming message.
   * Builds a synthetic conversation if not already cached.
   *
   * @param queryClient - React Query client
   * @param message - Message to create/update conversation from
   * @param options - Upsert options
   * @returns The created or updated conversation
   */
  static upsertConversationFromMessage(
    queryClient: QueryClient,
    message: StandardMessage,
    options?: MergeOptions,
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

  /**
   * Replaces the entire conversation list for a channel.
   * Used when fetching fresh data from the server.
   *
   * @param queryClient - React Query client
   * @param conversations - New conversation list
   * @param channel - Channel to replace
   * @returns The replaced conversation list
   */
  static replaceConversationList(
    queryClient: QueryClient,
    conversations: Conversation[],
    channel: ChannelTypeEnum,
  ): Conversation[] {
    // Confirm any pending conversations that are now in the server list
    ConversationCacheHelper.confirmPendingConversations(
      queryClient,
      channel,
      conversations.map((conversation) => conversation.id),
    );

    // Replace the entire first page, preserving pageParams structure
    queryClient.setQueryData<InfiniteData<Conversation[], number>>(
      queryKeys.conversations.list(channel),
      (old) => ({
        pages: [conversations],
        pageParams: old?.pageParams ?? [1],
      }),
    );

    // Sync each conversation to detail cache
    for (const conversation of conversations) {
      ConversationCacheHelper.setConversationDetail(queryClient, conversation);
    }

    return conversations;
  }

  /**
   * Replaces a single conversation in the cache.
   * Convenience method that calls upsertConversation.
   *
   * @param queryClient - React Query client
   * @param conversation - Conversation to replace
   * @param channel - Channel to replace in
   * @returns The replaced conversation
   */
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

  // ==================== Unread Count Operations ====================

  /**
   * Increments the unread count for a conversation.
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation to update
   * @param channel - Channel the conversation belongs to
   * @returns Updated conversation or undefined if not found
   */
  static incrementUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    const result = ConversationCacheHelper.updateUnreadCount(
      queryClient,
      channel,
      conversationId,
      (count) => count + 1,
    );

    return ConversationCacheHelper.syncToDetailCache(queryClient, result.data);
  }

  /**
   * Updates conversation summary (lastMessage/lastMessageTime) and moves to top.
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation to update
   * @param channel - Channel the conversation belongs to
   * @param message - Message containing new summary data
   * @returns Updated conversation or undefined if not found
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

        // Move updated conversation to top of list
        const rest = conversations.filter((_, index) => index !== targetIndex);

        return [updatedConversation, ...rest];
      },
    );

    return ConversationCacheHelper.syncToDetailCache(
      queryClient,
      updatedConversation,
    );
  }

  /**
   * Decrements the unread count for a conversation.
   * Count cannot go below 0.
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation to update
   * @param channel - Channel the conversation belongs to
   * @param amount - Amount to decrement (default: 1)
   * @returns Updated conversation or undefined if not found
   */
  static decrementUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
    amount = 1,
  ): Conversation | undefined {
    const result = ConversationCacheHelper.updateUnreadCount(
      queryClient,
      channel,
      conversationId,
      (count) => Math.max(0, count - amount),
    );

    return ConversationCacheHelper.syncToDetailCache(queryClient, result.data);
  }

  /**
   * Clears the unread count for a conversation (sets to 0).
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation to update
   * @param channel - Channel the conversation belongs to
   * @returns Updated conversation or undefined if not found
   */
  static clearUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    const result = ConversationCacheHelper.updateUnreadCount(
      queryClient,
      channel,
      conversationId,
      () => 0,
    );

    return ConversationCacheHelper.syncToDetailCache(queryClient, result.data);
  }

  /**
   * Sets an exact unread count for a conversation.
   * Count cannot be negative (will be clamped to 0).
   *
   * @param queryClient - React Query client
   * @param conversationId - Conversation to update
   * @param channel - Channel the conversation belongs to
   * @param count - Exact count to set
   * @returns Updated conversation or undefined if not found
   */
  static setExactUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
    count: number,
  ): Conversation | undefined {
    const result = ConversationCacheHelper.updateUnreadCount(
      queryClient,
      channel,
      conversationId,
      () => Math.max(0, count),
    );

    return ConversationCacheHelper.syncToDetailCache(queryClient, result.data);
  }
}
