import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import type { UnreadCountResult } from '@/services/core/conversation.service';
import { useActiveConversationId, useStrategy } from '@/store';

/**
 * useChannelUnread：各渠道未读数量
 *
 * @description
 * 调用 `conversationService.getUnreadCount()` API 获取服务端精确未读数，
 * 按 `channels`（或 allowedChannels）过滤后返回。
 * 若服务未实现 `getUnreadCount`，则返回空对象。
 *
 * @param channels 可选，要计算的渠道列表；不传时使用 allowedChannels
 *
 * @example
 * ```tsx
 * const unreadByChannel = useChannelUnread(channels);
 * unreadByChannel[ChannelTypeEnum.SMS]       // → 3
 * unreadByChannel[ChannelTypeEnum.WhatsApp]  // → 10
 * ```
 */
export function useChannelUnread(
  channels?: readonly ChannelTypeEnum[],
): UnreadCountResult {
  const { conversationService } = useServices();
  const { allowedChannels } = useStrategy();
  const targetChannels = channels ?? allowedChannels;
  const activeConversationId = useActiveConversationId();

  const { data: unreadByChannel } = useQuery({
    queryKey: [
      ...queryKeys.conversations.unread({
        conversationId: activeConversationId,
      }),
      ...targetChannels,
    ],
    queryFn: () =>
      conversationService?.getUnreadCount?.({
        conversationId: activeConversationId,
      }),
    enabled: !!conversationService?.getUnreadCount && !!activeConversationId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  return useMemo(() => {
    if (!unreadByChannel) return {};

    // 只返回 targetChannels 内的渠道
    const result: Partial<Record<ChannelTypeEnum, number>> = {};

    for (const channel of targetChannels) {
      const count = unreadByChannel[channel];
      if (count != null && count > 0) {
        result[channel] = count;
      }
    }
    return result;
  }, [unreadByChannel, targetChannels]);
}
