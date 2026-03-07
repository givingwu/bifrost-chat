import type { QueryClient } from '@tanstack/react-query';
import type {
  MessageReceivedEvent,
  MessageStatusUpdatedEvent,
} from '@/services/message.service';
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
   * - 将新消息添加到对应会话的消息列表缓存中
   * @param event
   * @returns
   */
  pushNewMessage(event: MessageReceivedEvent) {
    const messages = MessageCacheHelper.getAllMessagesFromCache(
      this.queryClient,
      event.conversationId,
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
      return;
    }

    // 将新消息添加到缓存中（传入 channel 以匹配 useMessages 的 query key）
    MessageCacheHelper.addMessageToCache(
      this.queryClient,
      event.conversationId,
      event.message,
      { channel: event.message.channelType },
    );
  }

  /**
   * 处理消息状态更新事件，更新消息缓存
   * - 根据 messageId 或 tempId 定位到对应消息
   * - 更新消息状态（status 字段）
   * - 如果消息不存在，记录警告日志
   * @param event
   * @returns
   */
  updateMessageStatus(event: MessageStatusUpdatedEvent) {
    // 注意：event 暂无 channelType，更新的是无 channel 的缓存；若 useMessages 使用 channel，状态更新可能不生效
    MessageCacheHelper.updateMessageInCache(
      this.queryClient,
      event.conversationId,
      {
        id: event.messageId,
        tempId: event.tempId,
        status: event.status,
      },
      event.messageId,
      event.tempId,
    );
  }
}
