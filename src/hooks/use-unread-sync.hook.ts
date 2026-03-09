import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { MessageDirectionEnum } from '@/interfaces/message.interface';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/conversation-cache-helper.service';
import { MessageSyncService } from '@/services/message-sync.service';
import { useActiveConversationId } from '@/store';

/**
 * 未读同步 Hook：库内订阅 IMessageService 的实时消息与状态更新，并直接维护会话缓存。
 *
 * @description
 * 挂载后订阅 messageService.subscribeToMessages / subscribeToMessageStatus：
 * - 收到新消息时先同步消息缓存和会话摘要；
 * - 若消息是非激活会话的 incoming，则对应会话 unreadCount +1；
 * - 所有状态事件只更新消息缓存，不直接改动会话未读数。
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
          ConversationCacheHelper.incrementUnread(
            queryClient,
            event.conversationId,
          );
        }
      },
    );

    const unsubscribeStatus = messageService?.subscribeToMessageStatus?.(
      (event) => {
        messageSyncService.updateMessageStatus(event);
      },
    );

    return () => {
      unsubscribeMessages?.();
      unsubscribeStatus?.();
    };
  }, [messageService, messageSyncService, queryClient]);
}
