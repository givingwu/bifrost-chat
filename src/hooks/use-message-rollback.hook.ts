import { useEffect } from 'react';
import type { ComposerToolbarRef } from '@/components/composer/ComposerToolbar';

/**
 * 消息发送失败事件详情
 */
export interface MessageSendFailedEventDetail {
  /** 会话 ID */
  conversationId: string;
  /** 消息内容 */
  content: string;
  /** 模板 ID（可选） */
  templateId?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 消息回填 Hook
 *
 * @description
 * 监听消息发送失败事件，将消息内容回填到输入框
 * 用于处理不可重试的业务逻辑错误（如达到配额限制）
 *
 * @param composerRef ComposerToolbar 的 ref
 * @param conversationId 当前会话 ID（用于过滤事件）
 *
 * @example
 * ```tsx
 * function DefaultChatLayout() {
 *   const composerRef = useRef<ComposerToolbarRef>(null);
 *   const { activeConversationId } = useConversation();
 *
 *   // 使用消息回填 hook
 *   useMessageRollback(composerRef, activeConversationId);
 *
 *   return <ComposerWithSend ref={composerRef} conversationId={activeConversationId} />;
 * }
 * ```
 */
export function useMessageRollback(
  composerRef: React.RefObject<ComposerToolbarRef | null>,
  conversationId?: string | null,
) {
  useEffect(() => {
    // 如果没有 conversationId 或 composerRef，不监听事件
    if (!conversationId || !composerRef) {
      return;
    }

    const handleMessageSendFailed = (event: Event) => {
      const customEvent = event as CustomEvent<MessageSendFailedEventDetail>;
      const {
        conversationId: eventConversationId,
        content,
        templateId,
      } = customEvent.detail;

      // 只处理当前会话的失败事件
      if (eventConversationId !== conversationId) {
        return;
      }

      // 将消息内容回填到输入框
      composerRef.current?.setValue(content, templateId);
      composerRef.current?.focus();

      console.info(
        `[useMessageRollback] 消息已回填到输入框:`,
        eventConversationId,
        content.substring(0, 50),
      );
    };

    // 监听消息发送失败事件
    window.addEventListener('messageSendFailed', handleMessageSendFailed);

    return () => {
      window.removeEventListener('messageSendFailed', handleMessageSendFailed);
    };
  }, [composerRef, conversationId]);
}

/**
 * 触发消息发送失败事件的辅助函数
 *
 * @description
 * 用于在 useSendMessage 中触发消息回填
 *
 * @param detail 事件详情
 *
 * @example
 * ```typescript
 * // 在 useSendMessage 的 onSuccess 回调中
 * if (!isRetryable) {
 *   triggerMessageSendFailed({
 *     conversationId: variables.conversationId,
 *     content: variables.content,
 *     templateId: variables.extra?.templateId,
 *     error: data.error,
 *   });
 * }
 * ```
 */
export function triggerMessageSendFailed(
  detail: MessageSendFailedEventDetail,
): void {
  const event = new CustomEvent<MessageSendFailedEventDetail>(
    'messageSendFailed',
    {
      detail,
    },
  );
  window.dispatchEvent(event);
}
