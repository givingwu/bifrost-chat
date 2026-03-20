import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import type {
  UnreadCountParams,
  UnreadCountResult,
} from '@/services/core/conversation.service';

/**
 * useUnreadCount：从服务端获取精确未读数量
 *
 * @description
 * - 若 `conversationService` 未实现 `getUnreadCount`，静默返回 undefined
 * - 返回 `Partial<Record<ChannelTypeEnum, number>>`：按渠道分组的未读数
 * - staleTime 30s，refetchInterval 60s
 *
 * @param params 查询参数（包含 app/pin 及可选的 channelType/conversationId）
 *
 * @example
 * ```tsx
 * const { data } = useUnreadCount({ app: 'fox', pin: '123' });
 * // data?.[ChannelTypeEnum.SMS]   → SMS 渠道未读数
 * // data?.[ChannelTypeEnum.WhatsApp] → WhatsApp 渠道未读数
 * ```
 */
export function useUnreadCount(params?: UnreadCountParams): {
  data: UnreadCountResult | undefined;
  isLoading: boolean;
  refetch: () => void;
} {
  const { conversationService } = useServices();

  const enabled = !!conversationService?.getUnreadCount;

  const query = useQuery<UnreadCountResult>({
    queryKey: queryKeys.conversations.unread(params),
    // biome-ignore lint/style/noNonNullAssertion: 已通过 enabled 保护，enabled 为 true 时 getUnreadCount 必定存在
    queryFn: () => conversationService!.getUnreadCount!(params)!,
    enabled,
    staleTime: 1000 * 30, // 30s 内视为新鲜
    refetchInterval: 1000 * 60, // 每 60s 轮询一次
    refetchOnWindowFocus: true,
  });

  return query;
}
