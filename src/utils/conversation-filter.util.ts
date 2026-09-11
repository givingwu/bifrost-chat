import type { Conversation } from '@/interfaces/conversation.interface';

/**
 * 会话搜索配置选项
 */
export interface ConversationSearchOptions {
  /** 是否搜索用户名，默认 true */
  searchUserName?: boolean;
  /** 是否搜索最后一条消息，默认 true */
  searchLastMessage?: boolean;
  /** 是否搜索会话 ID，默认 true */
  searchConversationId?: boolean;
  /** 是否搜索手机号 (metadata.pin)，默认 true */
  searchPhone?: boolean;
  /** 是否搜索资产编号 (metadata.subjectId)，默认 true */
  searchSubjectId?: boolean;
  /** 自定义搜索字段 */
  customFields?: (conversation: Conversation) => string[];
}

/**
 * 检查单个会话是否匹配搜索查询
 *
 * @param conversation - 会话对象
 * @param query - 搜索查询字符串（会自动转换为小写）
 * @param options - 搜索配置选项
 * @returns 是否匹配
 */
export function conversationMatchesQuery(
  conversation: Conversation,
  query: string,
  options: ConversationSearchOptions = {},
): boolean {
  const {
    searchUserName = true,
    searchLastMessage = true,
    searchConversationId = true,
    searchPhone = true,
    searchSubjectId = true,
    customFields,
  } = options;

  // 统一转换为小写进行比较
  const normalizedQuery = query.toLowerCase();

  // 搜索用户名
  if (searchUserName) {
    const userName = conversation.user.name?.toLowerCase() || '';
    if (userName.includes(normalizedQuery)) return true;
  }

  // 搜索最后一条消息
  if (searchLastMessage) {
    const lastMessage = conversation.lastMessage?.toLowerCase() || '';
    if (lastMessage.includes(query)) return true;
  }

  // 搜索会话 ID
  if (searchConversationId) {
    const conversationId = conversation.id?.toLowerCase() || '';
    if (conversationId.includes(query)) return true;
  }

  // 搜索手机号/联系方式 (pin)
  if (searchPhone) {
    const phone = String(conversation.metadata?.pin ?? '').toLowerCase();
    if (phone.includes(query)) return true;
  }

  // 搜索资产编号 (subjectId)
  if (searchSubjectId) {
    const subjectId = String(
      conversation.metadata?.subjectId ?? '',
    ).toLowerCase();
    if (subjectId.includes(query)) return true;
  }

  // 自定义字段搜索
  if (customFields) {
    const customValues = customFields(conversation);
    for (const value of customValues) {
      if (value.toLowerCase().includes(query)) return true;
    }
  }

  return false;
}

/**
 * 过滤会话列表
 *
 * @param conversations - 会话列表
 * @param searchQuery - 搜索查询字符串
 * @param options - 搜索配置选项
 * @returns 过滤后的会话列表
 *
 * @example
 * ```tsx
 * const filtered = filterConversations(conversations, searchQuery);
 * ```
 *
 * @example使用自定义字段
 * ```tsx
 * const filtered = filterConversations(conversations, searchQuery, {
 *   customFields: (conv) => [conv.metadata?.orderId as string],
 * });
 * ```
 */
export function filterConversations(
  conversations: Conversation[],
  searchQuery: string,
  options: ConversationSearchOptions = {},
): Conversation[] {
  // 空查询直接返回原列表
  if (!searchQuery) {
    return conversations;
  }

  const query = searchQuery.toLowerCase().trim();

  // trim 后为空也直接返回原列表
  if (!query) {
    return conversations;
  }

  return conversations.filter((conversation) =>
    conversationMatchesQuery(conversation, query, options),
  );
}
