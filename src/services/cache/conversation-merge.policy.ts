import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation, User } from '@/interfaces/conversation.interface';

export type ConversationMergeSource =
  | 'authoritative-list'
  | 'authoritative-detail'
  | 'authoritative-subscription'
  | 'projection';

export interface ConversationMergeOptions {
  preserveUnreadCount?: boolean;
}

const AUTHORITATIVE_METADATA_KEYS = new Set([
  'localState',
  'pendingSince',
  'pendingSource',
  'synthetic',
  'seedMessageId',
]);

function isAuthoritativeSource(source: ConversationMergeSource): boolean {
  return source !== 'projection';
}

function isMeaningfulString(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function pickSourceString(
  existingValue: string | undefined,
  incomingValue: string | undefined,
  source: ConversationMergeSource,
): string | undefined {
  const existingPresent = isMeaningfulString(existingValue);
  const incomingPresent = isMeaningfulString(incomingValue);

  if (source === 'projection') {
    return existingPresent ? existingValue : (incomingValue ?? existingValue);
  }

  return incomingPresent ? incomingValue : (existingValue ?? incomingValue);
}

function pickSourceArray<T>(
  existingValue: T[] | undefined,
  incomingValue: T[] | undefined,
  source: ConversationMergeSource,
): T[] | undefined {
  const existingPresent = existingValue?.length ? existingValue : undefined;
  const incomingPresent = incomingValue?.length ? incomingValue : undefined;

  if (source === 'projection') {
    return existingPresent ?? incomingPresent;
  }

  return incomingPresent ?? existingPresent;
}

function isMetadataRecord(
  metadata: Conversation['metadata'],
): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null;
}

function mergeConversationMetadata(
  existing: Conversation['metadata'],
  incoming: Conversation['metadata'],
  source: ConversationMergeSource,
): Conversation['metadata'] {
  if (!isMetadataRecord(existing)) {
    return incoming;
  }
  if (!isMetadataRecord(incoming)) {
    return existing;
  }

  const ex = existing;
  const inc = incoming;
  const keys = new Set([...Object.keys(ex), ...Object.keys(inc)]);
  const out: Record<string, unknown> = {};

  for (const key of keys) {
    const existingValue = ex[key];
    const incomingValue = inc[key];

    if (
      key === 'synthetic' &&
      existingValue === false &&
      incomingValue === true
    ) {
      out[key] = false;
      continue;
    }

    const existingIsString = typeof existingValue === 'string';
    const incomingIsString = typeof incomingValue === 'string';

    if (existingIsString && incomingIsString) {
      const existingText = existingValue.trim();
      const incomingText = incomingValue.trim();

      if (existingText.length > 0 && incomingText.length === 0) {
        out[key] = existingValue;
        continue;
      }

      if (incomingText.length > 0) {
        out[key] = incomingValue;
        continue;
      }

      out[key] = incomingValue;
      continue;
    }

    if (incomingValue !== undefined) {
      out[key] = incomingValue;
      continue;
    }

    out[key] = existingValue;
  }

  if (isAuthoritativeSource(source)) {
    for (const key of AUTHORITATIVE_METADATA_KEYS) {
      delete out[key];
    }
  }

  return out as Conversation['metadata'];
}

/**
 * 根据来源合并用户信息。
 *
 * 权威来源允许覆盖 status、avatar、邮箱、电话和角色；
 * projection 只补齐缺失字段，不覆盖已有的权威信息。
 */
export function mergeUser(
  existingUser: User,
  incomingUser: User,
  source: ConversationMergeSource,
): User {
  const authoritative = isAuthoritativeSource(source);

  return {
    ...existingUser,
    ...incomingUser,
    id: existingUser.id || incomingUser.id,
    name: pickSourceString(existingUser.name, incomingUser.name, source) ?? '',
    avatarUrl: pickSourceString(
      existingUser.avatarUrl,
      incomingUser.avatarUrl,
      source,
    ),
    status: authoritative
      ? (incomingUser.status ?? existingUser.status)
      : (existingUser.status ?? incomingUser.status),
    email: pickSourceString(existingUser.email, incomingUser.email, source),
    phone: pickSourceString(existingUser.phone, incomingUser.phone, source),
    role: pickSourceString(existingUser.role, incomingUser.role, source),
    tags: pickSourceArray(existingUser.tags, incomingUser.tags, source),
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

export function mergeConversation(
  existingConversation: Conversation,
  incomingConversation: Conversation,
  source: ConversationMergeSource,
  options?: ConversationMergeOptions,
): Conversation {
  const mergedMetadata = mergeConversationMetadata(
    existingConversation.metadata,
    incomingConversation.metadata,
    source,
  );
  const shouldPreserveUnread =
    options?.preserveUnreadCount ?? source === 'projection';

  return {
    ...existingConversation,
    ...incomingConversation,
    user: mergeUser(
      existingConversation.user,
      incomingConversation.user,
      source,
    ),
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
    createdAt: incomingConversation.createdAt ?? existingConversation.createdAt,
    updatedAt: incomingConversation.updatedAt ?? existingConversation.updatedAt,
    metadata: mergedMetadata,
    supportedChannels: mergeSupportedChannels(
      incomingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
      existingConversation.supportedChannels as ChannelTypeEnum[] | undefined,
    ),
  };
}
