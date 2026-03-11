import type { QueryClient } from '@tanstack/react-query';
import { AgentStatusEnum } from '@/interfaces/agent.interface';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
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
import type { UnreadCountResult } from '@/services/core/conversation.service';

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
  static getConversations(
    queryClient: QueryClient,
    channel: ChannelTypeEnum,
  ): Conversation[] {
    return (
      queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.list(channel),
      ) ?? []
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
    },
  ): Conversation {
    let nextConversation = conversation;

    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.list(channel),
      (old) => {
        const conversations = old ?? [];
        const existingConversation = conversations.find(
          (item) => item.id === conversation.id,
        );

        nextConversation = existingConversation
          ? mergeConversation(existingConversation, conversation, options)
          : conversation;

        const restConversations = conversations.filter(
          (item) => item.id !== conversation.id,
        );

        return [nextConversation, ...restConversations];
      },
    );

    return nextConversation;
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
    queryClient.setQueryData(queryKeys.conversations.list(channel), conversations);
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

    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.list(channel),
      (old) =>
        (old ?? []).map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          nextConversation = {
            ...conversation,
            unreadCount: conversation.unreadCount + 1,
          };
          return nextConversation;
        }),
    );

    return nextConversation;
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

    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.list(channel),
      (old) =>
        (old ?? []).map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          nextConversation = {
            ...conversation,
            unreadCount: Math.max(0, conversation.unreadCount - amount),
          };
          return nextConversation;
        }),
    );

    return nextConversation;
  }

  static clearUnread(
    queryClient: QueryClient,
    conversationId: string,
    channel: ChannelTypeEnum,
  ): Conversation | undefined {
    let nextConversation: Conversation | undefined;

    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.list(channel),
      (old) =>
        (old ?? []).map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }

          nextConversation = {
            ...conversation,
            unreadCount: 0,
          };
          return nextConversation;
        }),
    );

    return nextConversation;
  }

  static sumTotalUnread(conversations: Conversation[]): number {
    return conversations.reduce(
      (sum, conversation) => sum + Math.max(0, conversation.unreadCount),
      0,
    );
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

    queryClient.setQueryData<Conversation[]>(
      queryKeys.conversations.list(channel),
      (old) =>
        (old ?? []).map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          nextConversation = { ...conversation, unreadCount: Math.max(0, count) };
          return nextConversation;
        }),
    );

    return nextConversation;
  }
}
