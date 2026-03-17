import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { ConversationMetadata } from '@/services/core/conversation.service';
import { useConversationDetail } from './use-conversation-detail.hook';

function toConversationMetadata<
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
>(conversation: Conversation | null | undefined): TConversationMetadata | null {
  if (!conversation) {
    return null;
  }

  const metadataRecord =
    conversation.metadata && typeof conversation.metadata === 'object'
      ? conversation.metadata
      : {};
  const metadata = metadataRecord as TConversationMetadata;
  const supportedChannels =
    conversation.supportedChannels && conversation.supportedChannels.length > 0
      ? conversation.supportedChannels
      : metadata.supportedChannels;

  return {
    ...metadata,
    supportedChannels,
  } as TConversationMetadata;
}

/**
 * 使用会话元数据的 Hook
 *
 * @description
 * 使用 React Query 管理会话元数据的获取和缓存。
 * 获取会话的支持渠道、自由文本模板等信息。
 *
 * @param conversationId 会话 ID
 * @returns Query 结果
 *
 * @example
 * ```tsx
 * function ConversationInfo({ conversationId }) {
 *   const { data: metadata, isLoading, error } = useConversationMetadata(conversationId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       <p>支持渠道: {metadata?.supportedChannels?.join(', ')}</p>
 *       <p>客户: {metadata?.customerName}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConversationMetadata<
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
>(conversationId: string) {
  const queryClient = useQueryClient();
  const detailQuery = useConversationDetail(conversationId);

  const fallbackConversation = conversationId
    ? ConversationCacheHelper.findConversation(queryClient, conversationId)
    : undefined;
  const data = useMemo(
    () =>
      toConversationMetadata<TConversationMetadata>(
        detailQuery.data ?? fallbackConversation,
      ),
    [detailQuery.data, fallbackConversation],
  );

  return {
    ...detailQuery,
    data,
  };
}
