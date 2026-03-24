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

/**
 * 投影模块的合并选项。
 */
export interface MessageProjectionOptions {
  /**
   * 是否保留已有会话的未读数。
   */
  preserveUnreadCount?: boolean;
  /**
   * 是否应将会话移动到列表顶部。
   */
  moveToTop?: boolean;
}

/**
 * 消息投影结果。
 */
export interface MessageProjectionResult {
  /**
   * 投影后的会话。
   */
  conversation: Conversation;
  /**
   * 是否需要移动到列表顶部。
   */
  moveToTop: boolean;
}

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

const METADATA_NAME_KEYS = {
  common: ['customerName', 'contactName', 'displayName', 'userName', 'name'],
  incoming: ['senderName', 'fromName'],
  outgoing: ['receiverName', 'toName'],
} as const;

const METADATA_AVATAR_KEYS = {
  common: ['avatarUrl', 'avatar', 'customerAvatarUrl', 'contactAvatarUrl'],
  incoming: ['senderAvatarUrl', 'fromAvatarUrl'],
  outgoing: ['receiverAvatarUrl', 'toAvatarUrl'],
} as const;

/**
 * 判断对象是否为可合并的元数据记录。
 *
 * @param metadata - 待检查的元数据
 * @returns 是否为非空对象
 */
function isMetadataRecord(
  metadata: Conversation['metadata'],
): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null;
}

/**
 * 选择首个非空字符串元数据字段。
 *
 * @param metadata - 元数据对象
 * @param keys - 按优先级排列的字段名
 * @returns 首个可用字符串或 `undefined`
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
 * 判断字符串是否像邮箱。
 *
 * @param value - 待判断字符串
 * @returns 是否包含邮箱特征
 */
function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

/**
 * 压缩空白并去除首尾空白。
 *
 * @param value - 待规范化的文本
 * @returns 规范化后的文本
 */
function normalizePreviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * 根据消息方向获取对端参与方。
 *
 * @param message - 标准化消息
 * @returns 对端参与方
 */
function getPeerParticipant(message: StandardMessage): MessageParticipant {
  return message.direction === MessageDirectionEnum.Outgoing
    ? message.receiver
    : message.sender;
}

/**
 * 合并支持渠道并去重。
 *
 * @param existingChannels - 已有支持渠道
 * @param incomingChannels - 新增支持渠道
 * @returns 去重后的渠道数组；两侧都为空时返回 `undefined`
 */
function mergeSupportedChannels(
  existingChannels?: ChannelTypeEnum[],
  incomingChannels?: ChannelTypeEnum[],
): ChannelTypeEnum[] | undefined {
  const merged = [
    ...(existingChannels ?? []),
    ...(incomingChannels ?? []),
  ] as ChannelTypeEnum[];

  return merged.length > 0 ? [...new Set(merged)] : undefined;
}

/**
 * 合并会话用户信息，优先保留已有的更丰富字段。
 *
 * @param existingUser - 已有用户
 * @param incomingUser - 投影用户
 * @returns 合并后的用户
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
 * 合并会话元数据，保留已有的更丰富字段。
 *
 * @param existing - 现有元数据
 * @param incoming - 投影元数据
 * @returns 合并后的元数据
 */
function mergeMetadata(
  existing: Conversation['metadata'],
  incoming: Conversation['metadata'],
): Conversation['metadata'] {
  if (!isMetadataRecord(existing)) {
    return incoming;
  }

  if (!isMetadataRecord(incoming)) {
    return existing;
  }

  const keys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);
  const merged: Record<string, unknown> = {};

  for (const key of keys) {
    const existingValue = existing[key];
    const incomingValue = incoming[key];

    if (
      key === 'synthetic' &&
      existingValue === false &&
      incomingValue === true
    ) {
      merged[key] = false;
      continue;
    }

    const existingIsString = typeof existingValue === 'string';
    const incomingIsString = typeof incomingValue === 'string';

    if (existingIsString && incomingIsString) {
      const existingText = existingValue.trim();
      const incomingText = incomingValue.trim();

      if (existingText.length > 0 && incomingText.length === 0) {
        merged[key] = existingValue;
        continue;
      }

      if (incomingText.length > 0) {
        merged[key] = incomingValue;
        continue;
      }
    }

    if (incomingValue !== undefined) {
      merged[key] = incomingValue;
      continue;
    }

    merged[key] = existingValue;
  }

  return merged;
}

/**
 * 提取消息预览文本。
 *
 * @param message - 标准化消息
 * @returns 用于列表展示的预览文本
 */
export function getPreviewText(message: StandardMessage): string {
  const content = message.content as Partial<
    Record<'text' | 'address' | 'desc', unknown>
  >;

  for (const candidate of [content.text, content.address, content.desc]) {
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
 * 基于消息构造用于列表投影的合成用户。
 *
 * @param message - 标准化消息
 * @returns 合成用户对象
 */
export function buildSyntheticUser(message: StandardMessage): User {
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

/**
 * 基于消息构造合成会话。
 *
 * @param message - 标准化消息
 * @returns 可直接渲染的合成会话
 */
export function buildSyntheticConversation(
  message: StandardMessage,
): Conversation {
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
 * 将消息投影到现有会话上。
 *
 * @param existingConversation - 已有会话
 * @param message - 最新消息
 * @param options - 投影选项
 * @returns 投影结果以及置顶信号
 */
export function applyMessageProjection(
  existingConversation: Conversation | undefined,
  message: StandardMessage,
  options?: MessageProjectionOptions,
): MessageProjectionResult {
  const syntheticConversation = buildSyntheticConversation(message);
  const moveToTop = options?.moveToTop ?? true;

  if (!existingConversation) {
    return {
      conversation: syntheticConversation,
      moveToTop,
    };
  }

  const preserveUnreadCount = options?.preserveUnreadCount ?? true;

  return {
    moveToTop,
    conversation: {
      ...existingConversation,
      ...syntheticConversation,
      user: mergeUser(existingConversation.user, syntheticConversation.user),
      lastMessage: syntheticConversation.lastMessage,
      lastMessageTime: syntheticConversation.lastMessageTime,
      unreadCount: preserveUnreadCount
        ? (existingConversation.unreadCount ??
          syntheticConversation.unreadCount)
        : syntheticConversation.unreadCount,
      isActive: existingConversation.isActive,
      status: syntheticConversation.status ?? existingConversation.status,
      priority: syntheticConversation.priority ?? existingConversation.priority,
      createdAt:
        existingConversation.createdAt ?? syntheticConversation.createdAt,
      updatedAt:
        syntheticConversation.updatedAt ?? existingConversation.updatedAt,
      metadata: mergeMetadata(
        existingConversation.metadata,
        syntheticConversation.metadata,
      ),
      supportedChannels: mergeSupportedChannels(
        existingConversation.supportedChannels,
        syntheticConversation.supportedChannels,
      ),
    },
  };
}
