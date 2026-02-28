import { memo } from 'react';
import { useDeleteFailedMessage } from '@/hooks/use-delete-failed-message.hook';
import { useRetryMessage } from '@/hooks/use-retry-message.hook';
import type { StandardMessage } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { Button } from '../Button';

export interface MessageActionsProps {
  /** 消息对象 */
  message: StandardMessage;
  /** 会话 ID */
  conversationId?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageActions：失败消息操作组件
 *
 * @description
 * 显示在失败消息下方，提供重试和删除操作
 * 只对本地失败的消息显示（message._source === 'local'）
 *
 * @example
 * ```tsx
 * function MessageBubble({ message, conversationId }) {
 *   return (
 *     <div>
 *       <MessageContentRenderer message={message} />
 *       <MessageActions
 *         message={message}
 *         conversationId={conversationId}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const MessageActions = memo(
  ({ message, conversationId, className }: MessageActionsProps) => {
    const { t } = useTranslation();
    const retryMessage = useRetryMessage();
    const deleteMessage = useDeleteFailedMessage();
    const offlineMessageId = message._offlineMessageId;

    // 只对本地失败的消息显示操作按钮，且需要 conversationId
    if (
      message.status !== MessageStatusEnum.Failed ||
      !offlineMessageId ||
      !conversationId
    ) {
      return null;
    }

    const isRetryingCurrentMessage =
      retryMessage.isPending &&
      retryMessage.variables?.offlineMessageId === offlineMessageId;

    const isDeletingCurrentMessage =
      deleteMessage.isPending &&
      deleteMessage.variables?.offlineMessageId === offlineMessageId;

    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        <Button
          type="button"
          className="text-xs font-medium text-red-400 hover:text-red-500 cursor-pointer"
          onClick={() =>
            retryMessage.mutate({
              conversationId,
              offlineMessageId,
            })
          }
          disabled={isRetryingCurrentMessage}
          aria-busy={isRetryingCurrentMessage}
        >
          {t('message.retry')}
        </Button>
        <Button
          type="button"
          className="text-xs font-medium text-red-400 hover:text-red-500 cursor-pointer"
          aria-label={t('message.delete')}
          disabled={isDeletingCurrentMessage}
          aria-busy={isDeletingCurrentMessage}
          onClick={() =>
            deleteMessage.mutate({
              conversationId,
              offlineMessageId,
            })
          }
        >
          {t('message.delete')}
        </Button>

        {/* 错误提示 */}
        {message.error && (
          <span className="text-xs text-error/80" role="alert">
            {message.error instanceof Error
              ? message.error.message
              : message.error}
          </span>
        )}
      </div>
    );
  },
);

MessageActions.displayName = 'MessageActions';
