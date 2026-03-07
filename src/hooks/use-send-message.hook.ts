import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type {
  MessageSendResult,
  SendMessageOptions,
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
import { MessageSyncService } from '@/services/message-sync.service';
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import { useActiveConversationId, useStrategy } from '@/store';
import { useConversations } from './use-conversations.hook';

/**
 * 使用发送消息的 Hook
 *
 * @description
 * 使用 React Query Mutation 管理消息发送。
 * 支持乐观更新，发送前立即在 UI 上显示消息。
 * 订阅消息状态更新（如 WebSocket ptype=ack），收到后将对应消息状态更新为 sent 等。
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

const DEFAULT_EMPTY_DATA = {
  pageParams: [],
  pages: [],
};

export function useSendMessage<
  CMType = Record<string, unknown>,
  TMType = unknown,
>(defaultOptions?: Partial<SendMessageOptions<CMType, TMType>>) {
  const queryClient = useQueryClient();
  const messageSyncService = useMemo(
    () => new MessageSyncService(queryClient),
    [queryClient],
  );
  const { messageService, offlineMessageQueue } = useServices();
  const { activeChannel, allowedChannels, currentUser } = useStrategy();

  const activeConversationId = useActiveConversationId();
  const { data: conversations } = useConversations();
  const activeConversation = conversations?.find(
    (conversation) => conversation.id === activeConversationId,
  );

  useEffect(() => {
    const unsubscribe = messageService.subscribeToMessageStatus((event) => {
      messageSyncService.updateMessageStatus(event);
    });

    return () => {
      unsubscribe?.();
    };
  }, [messageService, messageSyncService]);

  return useMutation<
    MessageSendResult,
    Error,
    {
      conversationId: string;
      content: string;
      options?: Partial<SendMessageOptions<CMType, TMType>>;
    },
    {
      previousMessages: unknown;
      tempMessage: StandardMessage;
      messageQueryKey: readonly string[];
    }
  >({
    mutationFn: async (params) => {
      const options: SendMessageOptions<CMType, TMType> = {
        // 1. 默认选项（初始化时传入）
        ...defaultOptions,
        // 2. 内置默认值
        content: params.content,
        receiver: {
          app: currentUser.app,
          pin: activeConversation?.user?.id ?? '',
          clientType: currentUser.clientType,
          channelType: activeChannel ?? allowedChannels[0],
        },
        channelType: activeChannel ?? allowedChannels[0],
        // 3. 调用时的选项（优先级最高）
        ...params.options,
      };

      // 由于 useServices() 返回的 messageService 类型是固定的，
      // 需要类型断言来兼容泛型参数
      return messageService.send(
        params.conversationId,
        options as SendMessageOptions,
      );
    },

    // 乐观更新：在请求发送前立即在 UI 上显示消息
    onMutate: async (params) => {
      // 使用与 useMessages 一致的 query key（含 currentChannel），否则乐观更新写入的缓存与 UI 读取的缓存不一致
      const messageQueryKey = queryKeys.messages.list(
        params.conversationId,
        activeChannel ?? undefined,
      );

      // 取消正在进行的查询，避免覆盖我们的乐观更新
      await queryClient.cancelQueries({ queryKey: messageQueryKey });

      // 保存旧数据，以便在出错时回滚
      const previousMessages = queryClient.getQueryData(messageQueryKey);

      // 创建临时消息
      const tempMessage: StandardMessage = MessageBuilder.buildTextMessage(
        params.content,
        {
          fromApp: currentUser.app,
          fromPin: currentUser.pin,
          toPin: params.conversationId,
          channelType: activeChannel ?? allowedChannels[0],
          clientType: currentUser.clientType,
          conversationId: params.conversationId,
        },
      );
      tempMessage.status = MessageStatusEnum.Sending;

      // 使用 MessageCacheHelper 添加临时消息到缓存
      // 自动处理无限查询数据结构和去重
      MessageCacheHelper.addMessageToCache(
        queryClient,
        params.conversationId,
        tempMessage,
        { channel: activeChannel ?? undefined },
      );

      return { previousMessages, tempMessage, messageQueryKey };
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
        // 回滚到之前的状态（使用 onMutate 中的 query key）
        const queryKey =
          context?.messageQueryKey ??
          queryKeys.messages.list(variables.conversationId);
        queryClient.setQueryData(
          queryKey,
          context?.previousMessages ?? DEFAULT_EMPTY_DATA,
        );
        console.info('[useSendMessage] 已回滚到发送前的状态');
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
              ...variables.options,
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
          // 保存失败，回滚到之前的状态（使用 onMutate 中的 query key）
          const queryKey =
            context.messageQueryKey ??
            queryKeys.messages.list(variables.conversationId);
          queryClient.setQueryData(
            queryKey,
            context.previousMessages ?? DEFAULT_EMPTY_DATA,
          );
          console.info('[useSendMessage] 已回滚到发送前的状态');
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
        { channel: activeChannel ?? undefined },
      );
    },

    // 成功后，更新临时消息的状态
    onSuccess: async (data, variables, context) => {
      const tempId = context?.tempMessage.tempId;
      if (!tempId) return;

      const isFailed =
        data.status === MessageStatusEnum.Failed || Boolean(data.error);

      // 判断是否需要回滚
      // 1. 显式设置 needRollback 为 true
      // 2. 或者明确是不可重试的错误（retryable 为 false）
      // 3. 或者是业务逻辑错误（errorType 为非网络错误）
      // 4. 向后兼容：没有设置 errorType 和 retryable 时，默认回滚
      let shouldRollback = data.needRollback;

      if (isFailed && !shouldRollback) {
        if (data.retryable === false) {
          // 明确标记为不可重试，回滚
          shouldRollback = true;
        } else if (data.errorType && data.errorType !== 'network') {
          // 业务逻辑错误（非网络错误），回滚
          shouldRollback = true;
        } else if (!data.errorType && data.retryable === undefined) {
          // 向后兼容：没有设置 errorType 和 retryable 时，默认回滚
          shouldRollback = true;
        }
        // 其他情况（网络错误、可重试），不回滚
      }

      if (shouldRollback) {
        // 业务逻辑/状态失败：完全回滚到之前的状态（移除临时消息）
        console.error(
          '[useSendMessage] 发送结果状态为失败，执行回滚:',
          data.error,
        );

        // 回滚到之前的状态（移除临时消息，使用 onMutate 中的 query key）
        const queryKey =
          context?.messageQueryKey ??
          queryKeys.messages.list(variables.conversationId);
        queryClient.setQueryData(
          queryKey,
          context?.previousMessages ?? DEFAULT_EMPTY_DATA,
        );
        console.info('[useSendMessage] 已回滚到发送前的状态');

        return;
      }

      // 使用 MessageCacheHelper 更新临时消息为真实消息
      // 通过 id/tempId 查找消息，更新其 id 和 status
      // 这样可以确保在 WebSocket 推送之前完成缓存更新，避免时序问题
      const updates: Partial<StandardMessage> = {
        id: data.messageId ?? context?.tempMessage.id,
        status: isFailed
          ? MessageStatusEnum.Failed
          : (data.status ?? MessageStatusEnum.Sent),
      };

      // 只有在失败时才设置 error 字段
      if (isFailed) {
        updates.error = data.error ?? 'Send Failed';
      }

      MessageCacheHelper.updateMessageInCache(
        queryClient,
        variables.conversationId,
        updates,
        data.messageId, // messageId - 使用 tempId 查找
        tempId, // tempId
        { channel: activeChannel ?? undefined },
      );

      // 注册 messageId → conversationId 映射
      // 用于在 ACK 中缺少 chatId 时查找对应的会话
      const messageId = data.tempId ?? context?.tempMessage.tempId;
      if (messageId && variables.conversationId) {
        pendingMessageTracker.register(messageId, variables.conversationId);
        console.info('[useSendMessage] 已注册消息映射', {
          messageId,
          conversationId: variables.conversationId,
        });
      }
    },
  });
}
