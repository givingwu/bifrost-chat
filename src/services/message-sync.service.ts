import type { QueryClient } from '@tanstack/react-query';
import type {
  IMessageService,
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
  private readonly messageService: IMessageService;
  private unsubscribeMessages: (() => void) | null = null;
  private unsubscribeStatus: (() => void) | null = null;

  constructor(queryClient: QueryClient, messageService: IMessageService) {
    this.queryClient = queryClient;
    this.messageService = messageService;
  }

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

    MessageCacheHelper.addMessageToCache(
      this.queryClient,
      event.conversationId,
      event.message,
    );
  }

  updateMessageStatus(event: MessageStatusUpdatedEvent) {
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

  /**
   * 启动订阅
   */
  start(): void {
    this.stop();
    this.unsubscribeMessages = this.messageService.subscribeToMessages(
      this.pushNewMessage,
    );
    this.unsubscribeStatus = this.messageService.subscribeToMessageStatus(
      this.updateMessageStatus,
    );
  }

  /**
   * 停止订阅并清理
   */
  stop(): void {
    this.unsubscribeMessages?.();
    this.unsubscribeStatus?.();
    this.unsubscribeMessages = null;
    this.unsubscribeStatus = null;
  }
}
