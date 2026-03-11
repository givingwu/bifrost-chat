import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Conversation } from '@/interfaces/conversation.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { useActions, useActiveConversationId, useStrategy } from '@/store';

export interface ConversationBootstrapOptions<
  TQueryParams = unknown,
  TCreateParams = unknown,
> {
  /**
   * 是否启用会话引导。
   * 默认在提供 query/create 参数时自动启用。
   */
  enabled?: boolean;
  /**
   * 会话查询参数。
   * 详情页场景通常优先用它命中已有会话。
   */
  queryParams?: TQueryParams;
  /**
   * 会话创建参数。
   * 当 query 未命中且提供本参数时，会自动创建会话。
   */
  createParams?: TCreateParams;
}

/**
 * 会话引导 Hook。
 *
 * @description
 * 详情页场景可通过 query -> create 的顺序确保进入 SDK 时有可用会话，
 * 并在成功后自动同步 activeConversationId、activeChannel 与会话缓存。
 */
export function useConversationBootstrap<
  TQueryParams = unknown,
  TCreateParams = unknown,
>(options: ConversationBootstrapOptions<TQueryParams, TCreateParams> = {}) {
  const { enabled, queryParams, createParams } = options;
  const queryClient = useQueryClient();
  const { conversationService } = useServices();
  const activeConversationId = useActiveConversationId();
  const { activeChannel, allowedChannels } = useStrategy();
  const { setActiveConversationId, setStrategy } = useActions();

  const shouldBootstrap =
    (enabled ?? true) &&
    !activeConversationId &&
    (!!queryParams || !!createParams);

  const query = useQuery<Conversation | null>({
    queryKey: queryKeys.conversations.bootstrap({
      queryParams,
      createParams,
    }),
    queryFn: async () => {
      if (queryParams) {
        const existingConversation =
          await conversationService.query(queryParams);

        if (existingConversation) {
          return existingConversation;
        }
      }

      if (createParams) {
        return conversationService.create(createParams);
      }

      return null;
    },
    enabled: shouldBootstrap,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!query.data || activeConversationId) {
      return;
    }

    const nextConversation = query.data;
    const nextChannel = nextConversation.channel ?? activeChannel;
    const nextAllowedChannels = allowedChannels.includes(nextChannel)
      ? allowedChannels
      : [...allowedChannels, nextChannel];

    ConversationCacheHelper.upsertConversation(
      queryClient,
      nextConversation,
      nextChannel,
    );

    setStrategy({
      allowedChannels: nextAllowedChannels,
      activeChannel: nextChannel,
    });
    setActiveConversationId(nextConversation.id);
  }, [
    query.data,
    activeConversationId,
    activeChannel,
    allowedChannels,
    queryClient,
    setActiveConversationId,
    setStrategy,
  ]);

  return {
    ...query,
    isBootstrapping: shouldBootstrap && query.isPending,
    shouldBootstrap,
  };
}
