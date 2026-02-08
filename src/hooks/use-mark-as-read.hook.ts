import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageStatusEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';

export interface MarkAsReadParams {
  conversationId: string;
  messageIds: string[];
}

interface MarkAsReadContext {
  conversationId: string;
  previousData: unknown;
}

interface MessagesQueryData {
  pages: Array<{
    items: StandardMessage[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function isMarkAsReadParams(params: unknown): params is MarkAsReadParams {
  if (!params || typeof params !== 'object') return false;

  const value = params as Record<string, unknown>;

  return (
    typeof value.conversationId === 'string' &&
    Array.isArray(value.messageIds) &&
    value.messageIds.every((id) => typeof id === 'string')
  );
}

function isMessagesQueryData(data: unknown): data is MessagesQueryData {
  if (!data || typeof data !== 'object') return false;
  const value = data as Record<string, unknown>;
  if (!Array.isArray(value.pages)) return false;

  return value.pages.every((page) => {
    if (!page || typeof page !== 'object') return false;
    const items = (page as Record<string, unknown>).items;
    return Array.isArray(items);
  });
}

/**
 * 使用标记已读的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理消息已读标记。
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function MessageList({ conversationId }) {
 *   const markAsRead = useMarkAsRead();
 *
 *   useEffect(() => {
 *     // 当用户查看消息时，标记为已读
 *     markAsRead.mutate({
 *       conversationId,
 *       messageIds: ['msg-1', 'msg-2'],
 *     });
 *   }, [conversationId]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMarkAsRead<TParams = unknown>() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();

  return useMutation<void, unknown, TParams, MarkAsReadContext | undefined>({
    mutationFn: (params: TParams) => messageService.markAsRead(params),
    onMutate: async (params) => {
      if (!isMarkAsReadParams(params)) {
        return undefined;
      }

      const { conversationId, messageIds } = params;
      if (messageIds.length === 0) {
        return undefined;
      }

      void queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      const previousData = queryClient.getQueryData(
        queryKeys.messages.list(conversationId),
      );
      const readMessageIds = new Set(messageIds);

      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (oldData: unknown) => {
          if (!isMessagesQueryData(oldData)) {
            return oldData;
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => {
                const messageId = item.id || item.tempId;
                const shouldMarkAsRead =
                  !!messageId &&
                  readMessageIds.has(messageId) &&
                  item.status !== MessageStatusEnum.Read;

                return shouldMarkAsRead
                  ? { ...item, status: MessageStatusEnum.Read }
                  : item;
              }),
            })),
          };
        },
      );

      return {
        conversationId,
        previousData,
      };
    },
    onError: (_error, _params, context) => {
      if (!context) return;

      queryClient.setQueryData(
        queryKeys.messages.list(context.conversationId),
        context.previousData,
      );
    },
  });
}
