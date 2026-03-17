import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { ConversationMetadata } from '@/services/core/conversation.service';
import { useConversationDetail } from './use-conversation-detail.hook';

/**
 * 从会话对象中提取并规范化元数据。
 *
 * @description
 * 处理以下场景：
 * 1. metadata 不存在或非对象时返回空对象
 * 2. supportedChannels 优先从 conversation 顶层获取，其次从 metadata 获取
 * 3. 确保 supportedChannels 是有效数组
 *
 * @param conversation 会话对象，可能为 null/undefined
 * @returns 规范化后的元数据，或 null
 */
function extractConversationMetadata<
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
>(conversation: Conversation | null | undefined): TConversationMetadata | null {
  if (!conversation) {
    return null;
  }

  // 安全提取 metadata，确保是有效对象
  const rawMetadata =
    conversation.metadata && typeof conversation.metadata === 'object'
      ? (conversation.metadata as Record<string, unknown>)
      : {};

  // 优先从 rawMetadata 顶层获取 supportedChannels
  // 这样设计是因为某些 API 可能将 supportedChannels 放在顶层 metadata 中
  const topLevelSupportedChannels = rawMetadata.supportedChannels;
  const secondLevelSupportedChannels = conversation.supportedChannels;

  // 确定最终的 supportedChannels 值
  let resolvedSupportedChannels: ChannelTypeEnum[] | undefined;

  if (
    Array.isArray(topLevelSupportedChannels) &&
    topLevelSupportedChannels.length > 0
  ) {
    resolvedSupportedChannels = topLevelSupportedChannels;
  } else if (
    Array.isArray(secondLevelSupportedChannels) &&
    secondLevelSupportedChannels.length > 0
  ) {
    resolvedSupportedChannels =
      secondLevelSupportedChannels as ChannelTypeEnum[];
  }

  // 构建结果，保留原有 metadata 中的其他字段
  return {
    ...rawMetadata,
    supportedChannels: resolvedSupportedChannels,
  } as TConversationMetadata;
}

/**
 * 使用会话元数据的 Hook
 *
 * @description
 * 使用 React Query 管理会话元数据的获取和缓存。
 * 获取会话的支持渠道、自由文本模板等信息。
 *
 * 特性：
 * - 优先使用 `useConversationDetail` 获取的最新数据
 * - 当详情查询未返回数据时，回退到缓存查找
 * - 支持泛型扩展元数据类型
 * - 优化重渲染：使用 useMemo 缓存转换结果
 *
 * @template TConversationMetadata 扩展的元数据类型
 * @param conversationId 会话 ID
 * @returns Query 结果，data 字段为规范化后的元数据
 *
 * @example
 * ```tsx
 * function ConversationInfo({ conversationId }: { conversationId: string }) {
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
 *
 * @example
 * ```tsx
 * // 使用扩展元数据类型
 * interface MyMetadata extends ConversationMetadata {
 *   customerName?: string;
 *   priority?: 'high' | 'low';
 * }
 *
 * const { data } = useConversationMetadata<MyMetadata>(conversationId);
 * console.log(data?.customerName, data?.priority);
 * ```
 */
export function useConversationMetadata<
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
>(conversationId: string) {
  const queryClient = useQueryClient();
  const detailQuery = useConversationDetail(conversationId);

  // 使用 ref 存储上一次的有效数据，避免 loading 状态时数据闪烁
  const previousDataRef = useRef<TConversationMetadata | null>(null);

  // 计算回退数据：仅当 detailQuery.data 为空时才从缓存查找
  // 这样可以避免每次渲染都执行 findConversation
  const fallbackConversation = useMemo(() => {
    // 如果已有详情数据，不需要回退查找
    if (detailQuery.data) {
      return undefined;
    }
    // 仅在 conversationId 有效时才查找缓存
    return conversationId
      ? ConversationCacheHelper.findConversation(queryClient, conversationId)
      : undefined;
  }, [detailQuery.data, conversationId, queryClient]);

  // 转换并缓存元数据
  const data = useMemo(() => {
    const sourceConversation = detailQuery.data ?? fallbackConversation;
    const extractedMetadata =
      extractConversationMetadata<TConversationMetadata>(sourceConversation);

    // 更新 ref：当有有效数据时保存
    if (extractedMetadata) {
      previousDataRef.current = extractedMetadata;
    }

    return extractedMetadata;
  }, [detailQuery.data, fallbackConversation]);

  // 在 loading 状态下，如果有之前的数据则保留，避免 UI 闪烁
  const stableData =
    detailQuery.isLoading && previousDataRef.current
      ? previousDataRef.current
      : data;

  return {
    ...detailQuery,
    data: stableData,
    // 提供原始会话数据的访问（如需要）
    _rawConversation: detailQuery.data ?? fallbackConversation,
  } as typeof detailQuery & {
    data: TConversationMetadata | null;
    /** @internal 原始会话数据，仅供内部调试使用 */
    _rawConversation: Conversation | null | undefined;
  };
}

/**
 * 仅从缓存获取会话元数据的轻量 Hook（无网络请求）
 *
 * @description
 * 适用于已预加载会话列表的场景，避免触发额外的网络请求。
 *
 * @param conversationId 会话 ID
 * @returns 元数据或 null
 */
export function useConversationMetadataFromCache<
  TConversationMetadata extends ConversationMetadata = ConversationMetadata,
>(conversationId: string): TConversationMetadata | null {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!conversationId) {
      return null;
    }

    const conversation = ConversationCacheHelper.findConversation(
      queryClient,
      conversationId,
    );

    return extractConversationMetadata<TConversationMetadata>(conversation);
  }, [conversationId, queryClient]);
}
