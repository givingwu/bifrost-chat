import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { queryKeys } from '@/providers/query.provider';
import type { Conversation } from '@/interfaces/conversation.interface';
import type { UnreadCountResult } from '@/services/core/conversation.service';
import { useStrategy } from '@/store';

/**
 * useChannelUnread：读取各渠道未读数量（从 conversation list 缓存派生）
 *
 * @description
 * 遍历 `channels`（优先）或 store 中 `allowedChannels` 的会话列表，
 * 对每个渠道的 `unreadCount` 求和。
 * 无需独立缓存，与 `Conversation.unreadCount` 始终保持一致。
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
    const queryClient = useQueryClient();
    const { allowedChannels } = useStrategy();

    const targetChannels = channels ?? allowedChannels;

    return useMemo(() => {
        const result: Partial<Record<ChannelTypeEnum, number>> = {};

        for (const channel of targetChannels) {
            const conversations =
                queryClient.getQueryData<Conversation[]>(
                    queryKeys.conversations.list(channel),
                ) ?? [];

            const channelTotal = conversations.reduce(
                (sum, conv) => sum + Math.max(0, conv.unreadCount),
                0,
            );

            if (channelTotal > 0) {
                result[channel] = channelTotal;
            }
        }

        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient, targetChannels]);
}
