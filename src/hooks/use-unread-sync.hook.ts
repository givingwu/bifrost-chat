import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
} from '@/interfaces/message.interface';

import { useServices } from '@/providers/service.provider';
import { queryKeys } from '@/providers/query.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import { MessageSyncService } from '@/services/messaging/message-sync.service';
import { useActiveConversationId } from '@/store';
import type { UnreadCountResult } from '@/services/core/conversation.service';

/**
 * 未读同步 Hook：库内订阅 IMessageService 的实时消息与状态更新，并直接维护会话缓存。
 *
 * @description
 * 挂载后订阅 messageService.subscribeToMessages / subscribeToMessageStatus：
 *
 * **新消息（incoming chat_message）**：
 * - 会话级：通过增量映射与缓存共同实现 `unreadCount +1`
 * - 渠道级：按渠道的未读增量映射 `+1`
 * - 全局：由渠道级基线 + 增量求和派生
 *
 * **已读回执（status === Read）**：
 * - 会话级：按会话的未读增量映射 `-1`
 * - 渠道级：按渠道的未读增量映射 `-1`
 * - 展示值通过 `max(0, base + delta)` 保证不为负
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

        const channel = event.message.channelType;
        const conversationId = event.conversationId;

        // 更新会话摘要（lastMessage + lastMessageTime）并置顶
        ConversationCacheHelper.updateConversationSummary(
          queryClient,
          conversationId,
          channel,
          event.message,
        );

        if (event.message.direction === MessageDirectionEnum.Incoming) {
          // 会话缓存层：可选 +1，保持与增量映射大致一致
          ConversationCacheHelper.incrementUnread(
            queryClient,
            conversationId,
            channel,
          );

          // 渠道级未读增量 +1
          queryClient.setQueryData<UnreadCountResult>(
            queryKeys.conversations.unreadDeltas.channel(),
            (old) => {
              const current = old ?? {};
              const prev = current[channel] ?? 0;
              return {
                ...current,
                [channel]: prev + 1,
              };
            },
          );

          // 会话级未读增量 +1
          queryClient.setQueryData<Record<string, number>>(
            queryKeys.conversations.unreadDeltas.conversation(),
            (old) => {
              const current = old ?? {};
              const prev = current[conversationId] ?? 0;
              return {
                ...current,
                [conversationId]: prev + 1,
              };
            },
          );
        }
      },
    );

    const unsubscribeStatus = messageService?.subscribeToMessageStatus?.(
      (event) => {
        // useMessageStatusSync 负责更新消息缓存；
        // 此处只处理未读计数：Read ACK → 会话/渠道增量 -1
        if (event.status === MessageStatusEnum.Read && event.channelType) {
          const channel = event.channelType;
          const conversationId = event.conversationId;

          // 会话缓存层：未读数 -1（不小于 0）
          ConversationCacheHelper.decrementUnread(
            queryClient,
            conversationId,
            channel,
            1,
          );

          // 渠道级未读增量 -1
          queryClient.setQueryData<UnreadCountResult>(
            queryKeys.conversations.unreadDeltas.channel(),
            (old) => {
              const current = old ?? {};
              const prev = current[channel] ?? 0;
              return {
                ...current,
                [channel]: prev - 1,
              };
            },
          );

          // 会话级未读增量 -1
          queryClient.setQueryData<Record<string, number>>(
            queryKeys.conversations.unreadDeltas.conversation(),
            (old) => {
              const current = old ?? {};
              const prev = current[conversationId] ?? 0;
              return {
                ...current,
                [conversationId]: prev - 1,
              };
            },
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
