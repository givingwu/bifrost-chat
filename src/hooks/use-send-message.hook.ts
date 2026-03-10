import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  AuthorizationError,
  HTTPError,
  SDKError,
  ValidationError,
} from '@/errors/sdk.errors';
import {
  ConnectionFailedError,
  ConnectionTimeoutError,
  SendFailedError,
} from '@/errors/websocket.errors';
import { NetworkError } from '@/errors/network.error';
import type {
  MessageSendResult,
  SendMessageOptions,
  StandardMessage,
} from '@/interfaces/message.interface';
import {
  MessageFailureTypeEnum,
  MessagePriorityEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import {
  NetworkErrorCodeEnum,
  NetworkReachabilityEnum,
} from '@/interfaces/network.interface';
import { queryKeys } from '@/providers/query.provider';
import { useServices } from '@/providers/service.provider';
import { MessageBuilder } from '@/services/message-builder.service';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';
import { messageQueue } from '@/services/message-queue.service';
import { MessageSyncService } from '@/services/message-sync.service';
import { pendingMessageTracker } from '@/services/pending-message-tracker.service';
import { useActiveConversationId, useNetwork, useStrategy } from '@/store';
import { logger } from '@/utils/logger.util';
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
 *       logger.error('发送失败:', error);
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

function registerPendingAckMappings(
  conversationId: string,
  ids: Array<string | undefined>,
): void {
  const uniqueIds = [...new Set(ids.filter(Boolean))] as string[];

  for (const id of uniqueIds) {
    pendingMessageTracker.register(id, conversationId);
  }

  if (uniqueIds.length > 0) {
    logger.info('[useSendMessage] 已注册消息映射', {
      conversationId,
      messageIds: uniqueIds,
    });
  }
}

function shouldPersistFailedMessage(
  errorType?: MessageFailureTypeEnum,
  retryable?: boolean,
) {
  return errorType === MessageFailureTypeEnum.Network || retryable === true;
}

function resolveThrownErrorType(error: unknown): MessageFailureTypeEnum {
  if (
    error instanceof NetworkError ||
    error instanceof HTTPError ||
    error instanceof ConnectionTimeoutError ||
    error instanceof ConnectionFailedError ||
    error instanceof SendFailedError
  ) {
    return MessageFailureTypeEnum.Network;
  }

  if (error instanceof AuthorizationError) {
    return MessageFailureTypeEnum.Authorization;
  }

  if (error instanceof ValidationError) {
    return MessageFailureTypeEnum.Validation;
  }

  if (error instanceof SDKError) {
    return MessageFailureTypeEnum.BusinessLogic;
  }

  return MessageFailureTypeEnum.Network;
}

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
  const { reachability } = useNetwork();

  const activeConversationId = useActiveConversationId();
  const { data: conversations } = useConversations();
  const activeConversation = conversations?.find(
    (conversation) => conversation.id === activeConversationId,
  );

  const rollbackMessage = (
    conversationId: string,
    context?: {
      previousMessages: unknown;
      tempMessage: StandardMessage;
      messageQueryKey: readonly string[];
    },
  ) => {
    const queryKey =
      context?.messageQueryKey ?? queryKeys.messages.list(conversationId);
    queryClient.setQueryData(
      queryKey,
      context?.previousMessages ?? DEFAULT_EMPTY_DATA,
    );
    logger.info('[useSendMessage] 已回滚到发送前的状态');
  };

  const persistOfflineMessage = async (
    tempMessage: StandardMessage,
    conversationId: string,
    content: string,
    options?: Partial<SendMessageOptions<CMType, TMType>>,
    errorMessage?: string,
  ) => {
    if (!offlineMessageQueue) {
      return undefined;
    }

    const offlineMessage = offlineMessageQueue.createOfflineMessage(
      tempMessage,
      conversationId,
      {
        content,
        ...options,
      },
      options?.priority ?? MessagePriorityEnum.Normal,
    );

    offlineMessage.error = errorMessage;
    await offlineMessageQueue.enqueue(offlineMessage);

    return offlineMessage.id;
  };

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
    networkMode: 'always',
    mutationFn: async (params) => {
      if (reachability === NetworkReachabilityEnum.Offline) {
        throw new NetworkError(
          '网络不可用，消息已加入离线重试流程',
          NetworkErrorCodeEnum.NetworkUnreachable,
        );
      }

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

      registerPendingAckMappings(params.conversationId, [
        tempMessage.id,
        tempMessage.tempId,
      ]);
      messageQueue.enqueue({
        requestId: tempMessage.id,
        tempId: tempMessage.tempId ?? tempMessage.id,
        conversationId: params.conversationId,
        channelType: activeChannel ?? allowedChannels[0],
        rawMessage: tempMessage,
      });

      return { previousMessages, tempMessage, messageQueryKey };
    },

    // 网络错误：保存到离线队列（如果未实现则提示）
    onError: async (error, variables, context) => {
      if (error) {
        logger.error('[useSendMessage] 消息发送失败:', error);
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorType = resolveThrownErrorType(error);
      const shouldPersist = shouldPersistFailedMessage(errorType);
      const tempId = context?.tempMessage?.tempId;

      if (!context?.tempMessage || !shouldPersist || !offlineMessageQueue) {
        if (shouldPersist && !offlineMessageQueue) {
          logger.warn(
            '[useSendMessage] 离线队列未实现，可重试消息将回滚。请实现 OfflineMessageQueueService。',
          );
        }

        if (tempId) {
          messageQueue.dequeue(tempId);
        }
        rollbackMessage(variables.conversationId, context);
        return;
      }

      try {
        const offlineMessageId = await persistOfflineMessage(
          context.tempMessage,
          variables.conversationId,
          variables.content,
          variables.options,
          errorMessage,
        );

        if (tempId) {
          messageQueue.dequeue(tempId);
        }

        MessageCacheHelper.updateMessageInCache(
          queryClient,
          variables.conversationId,
          {
            status: MessageStatusEnum.Failed,
            error: errorMessage,
            _source: 'local',
            _offlineMessageId: offlineMessageId,
          },
          undefined,
          tempId,
          { channel: activeChannel ?? undefined },
        );

        logger.info(
          '[useSendMessage] 消息已保存到离线队列:',
          offlineMessageId,
        );
      } catch (queueError) {
        logger.error('[useSendMessage] 保存到离线队列失败:', queueError);
        if (tempId) {
          messageQueue.dequeue(tempId);
        }
        rollbackMessage(variables.conversationId, context);
      }
    },

    // 成功后，更新临时消息的状态
    onSuccess: async (data, variables, context) => {
      const tempId = context?.tempMessage.tempId;
      if (!tempId) return;

      const isFailed =
        data.status === MessageStatusEnum.Failed || Boolean(data.error);
      const shouldPersist = shouldPersistFailedMessage(
        data.errorType,
        data.retryable,
      );
      const shouldRollback =
        data.needRollback === true ||
        (isFailed &&
          !shouldPersist &&
          (data.retryable === false ||
            data.errorType !== undefined ||
            data.retryable === undefined));

      if (isFailed && shouldPersist) {
        if (!offlineMessageQueue) {
          logger.warn(
            '[useSendMessage] 离线队列未实现，可重试消息将回滚。请实现 OfflineMessageQueueService。',
          );
          rollbackMessage(variables.conversationId, context);
          messageQueue.dequeue(tempId);
          return;
        }

        try {
          const offlineMessageId = await persistOfflineMessage(
            context.tempMessage,
            variables.conversationId,
            variables.content,
            variables.options,
            data.error,
          );

          MessageCacheHelper.updateMessageInCache(
            queryClient,
            variables.conversationId,
            {
              id: data.messageId ?? context.tempMessage.id,
              status: MessageStatusEnum.Failed,
              error: data.error ?? 'Send Failed',
              _source: 'local',
              _offlineMessageId: offlineMessageId,
            },
            data.messageId,
            tempId,
            { channel: activeChannel ?? undefined },
          );

          messageQueue.dequeue(tempId);
          return;
        } catch (queueError) {
          logger.error('[useSendMessage] 保存到离线队列失败:', queueError);
          rollbackMessage(variables.conversationId, context);
          messageQueue.dequeue(tempId);
          return;
        }
      }

      if (shouldRollback) {
        // 业务逻辑/状态失败：完全回滚到之前的状态（移除临时消息）
        logger.error(
          '[useSendMessage] 发送结果状态为失败，执行回滚:',
          data.error,
        );

        rollbackMessage(variables.conversationId, context);
        messageQueue.dequeue(tempId);
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

      // 补充注册服务端返回的消息标识，兼容后续 ACK 不再使用本地临时 ID 的场景。
      registerPendingAckMappings(variables.conversationId, [
        data.messageId,
        data.tempId,
      ]);

      if (isFailed) {
        messageQueue.dequeue(tempId);
        return;
      }

      if (data.messageId) {
        const replayedEvents = messageQueue.bindServerMessageId(
          tempId,
          data.messageId,
        );

        for (const replayedEvent of replayedEvents) {
          messageSyncService.updateMessageStatus(replayedEvent);
        }
      }
    },
  });
}
