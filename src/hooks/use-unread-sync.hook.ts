import { useEffect } from 'react';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { useServices } from '@/providers/service.provider';
import { useActions } from '@/store';

/**
 * 未读同步 Hook：库内订阅 IMessageService 的实时消息与状态更新，自动维护未读增量。
 *
 * @description
 * 挂载后订阅 messageService.subscribeToMessages / subscribeToMessageStatus，
 * 收到新消息时该会话未读 +1，收到下行 msg_read_ack（status=Read）时该会话未读 -1。
 * 无需订阅方再注册或调用回调，只要宿主在实现 IMessageService 时将 WebSocket 的
 * chat_message / MessageStatus 事件转发到上述两个订阅即可。
 *
 * 使用 DefaultChatLayout 时会在布局内自动调用本 Hook；自定义布局时可在根组件调用一次以启用未读同步。
 */
export function useUnreadSync(): void {
  const actions = useActions();
  const { messageService } = useServices();

  useEffect(() => {
    if (!messageService?.subscribeToMessages || !messageService?.subscribeToMessageStatus) {
      return;
    }

    const unsubMessages = messageService.subscribeToMessages((event) => {
      if (event.conversationId) {
        actions.incrementUnread(event.conversationId);
      }
    });

    const unsubStatus = messageService.subscribeToMessageStatus((event) => {
      if (event.status === MessageStatusEnum.Read && event.conversationId) {
        actions.decrementUnread(event.conversationId);
      }
    });

    return () => {
      unsubMessages?.();
      unsubStatus?.();
    };
  }, [messageService, actions]);
}
