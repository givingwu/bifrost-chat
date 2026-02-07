import type { Conversation } from '@/interfaces/conversation.interface';

/**
 * 会话列表项间距（对应 Tailwind `space-y-1` = 4px）
 */
export const CONVERSATION_LIST_ITEM_GAP = 4;

/**
 * 获取会话高度缓存 key
 *
 * @description
 * 使用会话 id 作为缓存 key，确保缓存稳定性。
 */
export function getConversationHeightCacheKey(
  conversation: Conversation,
): string | null {
  if (conversation.id) {
    return conversation.id;
  }
  return null;
}

/**
 * 估算会话项高度（用于虚拟滚动初始化）
 *
 * @description
 * 会话项高度相对固定，基于 ConversationItem 组件的实际渲染高度估算。
 * 虚拟滚动会使用这个值作为初始估算，然后通过 measureElement 动态测量实际高度。
 *
 * @returns 估算的会话项高度（像素）
 *
 * @example
 * ```typescript
 * const height = estimateConversationHeight();
 * // 返回 72px（基于 ConversationItem 组件的实际高度）
 * ```
 */
export function estimateConversationHeight(): number {
  return 78;
}

/**
 * 会话高度缓存（用于性能优化）
 *
 * @description
 * 缓存已测量的会话项高度，避免重复计算。
 * 使用会话 id 作为缓存 key，确保缓存稳定性。
 */
const conversationHeightCache = new Map<string, number>();

/**
 * 获取缓存的会话项高度
 *
 * @param conversation - 会话对象
 * @returns 缓存的高度，如果不存在则返回 undefined
 */
export function getCachedConversationHeight(
  conversation: Conversation,
): number | undefined {
  const cacheKey = getConversationHeightCacheKey(conversation);

  if (!cacheKey) {
    return undefined;
  }

  return conversationHeightCache.get(cacheKey);
}

/**
 * 设置缓存的会话项高度
 *
 * @param conversation - 会话对象
 * @param height - 会话项高度
 */
export function setCachedConversationHeight(
  conversation: Conversation,
  height: number,
): void {
  const cacheKey = getConversationHeightCacheKey(conversation);

  if (!cacheKey) {
    return;
  }

  conversationHeightCache.set(cacheKey, height);
}

/**
 * 清除会话项高度缓存
 *
 * @description
 * 在某些情况下（如会话内容更新），需要清除缓存以重新测量高度。
 *
 * @param conversation - 会话对象
 */
export function clearCachedConversationHeight(
  conversation: Conversation,
): void {
  const cacheKey = getConversationHeightCacheKey(conversation);

  if (!cacheKey) {
    return;
  }

  conversationHeightCache.delete(cacheKey);
}
