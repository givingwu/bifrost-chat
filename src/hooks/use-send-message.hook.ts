import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MessageSendResult,
  StandardMessage,
} from '@/interfaces/message.interface';
import {
  MessagePriorityEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageBuilder } from '@/services/message-builder.service';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';
import { useStrategy } from '@/store';

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
  const { messageService, offlineMessageQueue } = useServices();
  const { activeChannel, allowedChannels } = useStrategy();

  return useMutation<
    MessageSendResult,
    Error,
    {
      conversationId: string;
      content: string;
      extra?: TParams;
    },
    {
      previousMessages: unknown;
      tempMessage: StandardMessage;
    }
  >({
    mutationFn: async (params) => {
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
          channelType: activeChannel ?? allowedChannels[0],
        },
      );
      tempMessage.status = MessageStatusEnum.Sending;

      // 使用 MessageCacheHelper 添加临时消息到缓存
      // 自动处理无限查询数据结构和去重
      MessageCacheHelper.addMessageToCache(
        queryClient,
        params.conversationId,
        tempMessage,
      );

      return { previousMessages, tempMessage };
    },

    // 网络错误：保存到离线队列（如果未实现则提示）
    onError: async (error, variables, context) => {
      if (error) {
        console.error('[useSendMessage] 消息发送失败:', error);
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 如果没有离线队列服务，提示实现
      if (!offlineMessageQueue) {
        console.warn(
          '[useSendMessage] 离线队列未实现，网络错误时消息将丢失。请实现 IOfflineMessageQueueService。',
        );
        // 回滚到之前的状态
        if (context?.previousMessages) {
          queryClient.setQueryData(
            queryKeys.messages.list(variables.conversationId),
            context.previousMessages,
          );
          console.info('[useSendMessage] 已回滚到发送前的状态');
        }
        return;
      }

      // 将失败的消息保存到离线队列
      if (context?.tempMessage) {
        try {
          const offlineMessage = offlineMessageQueue.createOfflineMessage(
            context.tempMessage,
            variables.conversationId,
            {
              content: variables.content,
              ...variables.extra,
            },
            MessagePriorityEnum.Normal,
          );

          // 添加错误信息
          offlineMessage.error = errorMessage;

          await offlineMessageQueue.enqueue(offlineMessage);

          console.info(
            '[useSendMessage] 消息已保存到离线队列:',
            offlineMessage.id,
          );
        } catch (queueError) {
          console.error('[useSendMessage] 保存到离线队列失败:', queueError);
          // 保存失败，回滚到之前的状态
          if (context?.previousMessages) {
            queryClient.setQueryData(
              queryKeys.messages.list(variables.conversationId),
              context.previousMessages,
            );
            console.info('[useSendMessage] 已回滚到发送前的状态');
          }
          return;
        }
      }

      // 更新消息状态为 Failed
      const updates: Partial<StandardMessage> = {
        status: MessageStatusEnum.Failed,
        error: errorMessage,
        _source: 'local',
        _offlineMessageId: context?.tempMessage.tempId,
      };

      // 使用 MessageCacheHelper 更新消息状态为 Failed
      // 支持通过 tempId 查找消息
      MessageCacheHelper.updateMessageInCache(
        queryClient,
        variables.conversationId,
        updates,
        undefined, // messageId
        context?.tempMessage.tempId, // tempId
      );
    },

    // 成功后，更新临时消息的状态
    onSuccess: async (data, variables, context) => {
      const tempId = context?.tempMessage.tempId;
      if (!tempId) return;

      // 有 responseCode 时仅按 code 判断：code === 0 一律不回退、保留在页面，code !== 0 才回退；未传 responseCode 时沿用 status/error
      const isFailed =
        data.responseCode === 0
          ? false
          : data.responseCode !== undefined
            ? true
            : (data.status !== MessageStatusEnum.Sent || Boolean(data.error));

      if (isFailed) {
        // 业务逻辑错误 / code=1：完全回滚到之前的状态（移除临时消息）
        console.error(
          '[useSendMessage] 业务逻辑错误或 code=1，执行回滚:',
          data.error ?? data.responseCode,
        );

        // 回滚到之前的状态（移除临时消息）
        if (context?.previousMessages) {
          queryClient.setQueryData(
            queryKeys.messages.list(variables.conversationId),
            context.previousMessages,
          );
          console.info('[useSendMessage] 已回滚到发送前的状态');
        }

        return;
      }

      // 使用 MessageCacheHelper 更新临时消息为真实消息
      // 通过 tempId 查找消息，更新其 id 和 status
      // 这样可以确保在 WebSocket 推送之前完成缓存更新，避免时序问题
      MessageCacheHelper.updateMessageInCache(
        queryClient,
        variables.conversationId,
        {
          id: data.messageId ?? context?.tempMessage.id,
          status: data.status ?? MessageStatusEnum.Sent,
        },
        undefined, // messageId - 使用 tempId 查找
        tempId, // tempId
      );
    },
  });
}
