import type { QueryClient } from '@tanstack/react-query';
import { ConversationCacheHelper } from '@/services/conversation-cache-helper.service';
import type { MessageStatusUpdatedEvent } from '@/interfaces/message.interface';
import type { MessageReceivedEvent } from '@/services/message.service';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';

/**
 * MessageSyncService
 *
 * @description
 * 统一编排消息订阅与缓存更新。
 * 宿主通过 IMessageService 提供事件流，SDK 内部负责缓存落地。
 */
export class MessageSyncService {
  private readonly queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * 处理新消息事件，更新消息缓存
   * - 检测重复消息（message.id 或 tempId 已存在），避免重复添加
   * - 如果会话列表中不存在该会话，则基于消息构造一个临时会话并插入顶部
   * - 将新消息添加到对应会话的消息列表缓存中
   * @param event
   * @returns
   */
  pushNewMessage(event: MessageReceivedEvent) {
    ConversationCacheHelper.upsertConversationFromMessage(
      this.queryClient,
      event.message,
    );

    const messages = MessageCacheHelper.getAllMessagesFromCache(
      this.queryClient,
      event.conversationId,
      { channel: event.message.channelType },
    );

    if (MessageCacheHelper.messageExists(messages, event.message)) {
      console.warn(
        '[MessageSyncService] 检测到重复消息，已忽略。请检查 WebSocket 推送 message.id/tempId 是否唯一。',
        {
          conversationId: event.conversationId,
          messageId: event.message.id,
          tempId: event.message.tempId,
        },
      );
      return { isNewMessage: false };
    }

    // 将新消息添加到缓存中（传入 channel 以匹配 useMessages 的 query key）
    MessageCacheHelper.addMessageToCache(
      this.queryClient,
      event.conversationId,
      event.message,
      { channel: event.message.channelType },
    );

    return { isNewMessage: true };
  }

  /**
   * 处理消息状态更新事件，更新消息缓存
   * - 根据 messageId 或 tempId 定位到对应消息
   * - 更新消息状态（status 字段）
   * - 同时兼容无 channel 与按 channel 分片缓存
   * - 如果消息不存在，记录警告日志
   * @param event
   * @returns
   */
  updateMessageStatus(event: MessageStatusUpdatedEvent) {
    const updates = {
      id: event.messageId,
      tempId: event.tempId,
      status: event.status,
      ...(event.error !== undefined ? { error: event.error } : {}),
    };

    // 1) 始终兼容无 channel 的缓存
    MessageCacheHelper.updateMessageInCache(
      this.queryClient,
      event.conversationId,
      updates,
      event.messageId,
      event.tempId,
    );
    // 2) 若携带 channelType，再同步更新按 channel 分片缓存
    const channel = event.channelType;
    if (!channel) return;

    MessageCacheHelper.updateMessageInCache(
      this.queryClient,
      event.conversationId,
      updates,
      event.messageId,
      event.tempId,
      { channel },
    );
  }
}
