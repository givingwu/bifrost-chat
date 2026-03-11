import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { MessageSyncService } from '@/services/messaging/message-sync.service';
import { useActiveConversationId } from '@/store';

/**
 * 未读同步 Hook：库内订阅 IMessageService 的实时消息与状态更新，并直接维护会话缓存。
 *
 * @description
 * 挂载后订阅 messageService.subscribeToMessages / subscribeToMessageStatus：
 *
 * **新消息（incoming new message）**：
 * - 会话级：`unreadCount +1`
 * - 渠道级：`UnreadCountResult[channel] +1`（乐观更新）
 * - 全局：由渠道级求和派生，无需单独维护
 * - 同时使服务端未读 query 失效，触发下次轮询拉取精确值
 *
 * **已读回执（status === Read）**：
 * - 读取当前会话的 unreadCount 作为 delta
 * - 会话级：`clearUnread`（归零）
 * - 渠道级：`UnreadCountResult[channel] -= delta`（乐观更新）
 * - 同时使服务端未读 query 失效
 *
 * 使用 DefaultChatLayout 时会在布局内自动调用本 Hook；自定义布局时可在根组件调用一次以启用实时同步。
 */
export function useUnreadSync(): void {
  const queryClient = useQueryClient();
  const { messageService } = useServices();
  const activeConversationId = useActiveConversationId();
  const messageSyncService = useMemo(
    () => new MessageSyncService(queryClient),
    [queryClient],
  );
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (
      !messageService?.subscribeToMessages &&
      !messageService?.subscribeToMessageStatus
    ) {
      return;
    }

    const unsubscribeMessages = messageService?.subscribeToMessages?.(
      (event) => {
        const syncResult = messageSyncService.pushNewMessage(event);

        if (!syncResult.isNewMessage || !event.conversationId) {
          return;
        }

        if (
          event.message.direction === MessageDirectionEnum.Incoming &&
          event.conversationId !== activeConversationIdRef.current
        ) {
          const channel = event.message.channelType;

          // 会话级 +1（全局/渠道级从 conversation list 派生，自动跟进）
          ConversationCacheHelper.incrementUnread(
            queryClient,
            event.conversationId,
            channel,
          );
        }
      },
    );

    const unsubscribeStatus = messageService?.subscribeToMessageStatus?.(
      (event) => {
        // useMessageStatusSync 负责更新消息缓存；
        // 此处只处理未读计数：Read ACK → 会话级 -1
        if (event.status === MessageStatusEnum.Read && event.channelType) {
          const channel = event.channelType;
          const conversationId = event.conversationId;

          // 会话级 -1（全局/渠道级派生）
          ConversationCacheHelper.decrementUnread(
            queryClient,
            conversationId,
            channel,
            1,
          );
        }
      },
    );

    return () => {
      unsubscribeMessages?.();
      unsubscribeStatus?.();
    };
  }, [messageService, messageSyncService, queryClient]);
}
