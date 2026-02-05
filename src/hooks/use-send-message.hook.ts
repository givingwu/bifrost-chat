import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageBuilder } from '@/utils/message-builder.util';

/**
 * 使用发送消息的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理消息发送。
 * 支持乐观更新，发送前立即在 UI 上显示消息。
 *
 * @returns Mutation 结果
 *
 * @example
 * ```tsx
 * function MessageComposer({ conversationId }) {
 *   const [text, setText] = useState('');
 *   const sendMessage = useSendMessage();
 *
 *   const handleSend = async () => {
 *     if (!text.trim()) return;
 *
 *     try {
 *       await sendMessage.mutateAsync({
 *         conversationId,
 *         content: text,
 *       });
 *       setText('');
 *     } catch (error) {
 *       console.error('发送失败:', error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         value={text}
 *         onChange={(e) => setText(e.target.value)}
 *         disabled={sendMessage.isPending}
 *       />
 *       <button onClick={handleSend} disabled={sendMessage.isPending}>
 *         发送
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSendMessage<TParams = any>() {
  const queryClient = useQueryClient();
  const { messageService } = useServices();

  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      content: string;
      extra?: TParams;
    }) => {
      return messageService.send(params.conversationId, {
        content: params.content,
        ...params.extra,
      } as any);
    },

    // 乐观更新：在请求发送前立即在 UI 上显示消息
    onMutate: async (params) => {
      // 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(params.conversationId),
      });

      // 保存旧数据，以便在出错时回滚
      const previousMessages = queryClient.getQueryData(
        queryKeys.messages.list(params.conversationId),
      );

      // 创建临时消息
      const tempMessage: StandardMessage = MessageBuilder.buildTextMessage(
        params.content,
        {
          senderId: 'current-user',
          receiverId: params.conversationId,
          channelType: 'whatsapp' as any,
        },
      );
      tempMessage.status = MessageStatusEnum.Sending;

      // 乐观更新：立即添加消息到列表
      queryClient.setQueryData(
        queryKeys.messages.list(params.conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any, index: number) =>
              index === old.pages.length - 1
                ? {
                    ...page,
                    items: [...page.items, tempMessage],
                  }
                : page,
            ),
          };
        },
      );

      return { previousMessages, tempMessage };
    },

    // 如果出错，回滚到之前的状态
    onError: (error, variables, context) => {
      if (error) {
        console.error(error);
      }
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(variables.conversationId),
          context.previousMessages,
        );
      }
    },

    // 成功后，更新临时消息的状态
    onSuccess: (data, variables, context) => {
      // 更新临时消息为真实消息
      queryClient.setQueryData(
        queryKeys.messages.list(variables.conversationId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: StandardMessage) =>
                (item as any).tempId === (context as any)?.tempId
                  ? { ...item, ...data, status: MessageStatusEnum.Sent }
                  : item,
              ),
            })),
          };
        },
      );
    },
  });
}
