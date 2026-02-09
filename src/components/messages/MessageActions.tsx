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

    // 只对本地失败的消息显示操作按钮，且需要 conversationId
    if (
      message.status !== MessageStatusEnum.Failed ||
      !message._offlineMessageId ||
      !conversationId
    ) {
      return null;
    }

    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        <Button
          type="button"
          className="text-xs font-medium text-red-400 hover:text-red-500 cursor-pointer"
          onClick={() =>
            retryMessage.mutate({
              conversationId: conversationId ?? '',
              offlineMessageId: message._offlineMessageId!,
            })
          }
          disabled={retryMessage.isPending}
        >
          {t('message.retry')}
        </Button>
        <Button
          type="button"
          className="text-xs font-medium text-red-400 hover:text-red-500 cursor-pointer"
          aria-label={t('message.delete')}
          disabled={deleteMessage.isPending}
          onClick={() =>
            deleteMessage.mutate({
              conversationId: conversationId ?? '',
              offlineMessageId: message._offlineMessageId!,
            })
          }
        >
          {t('message.delete')}
        </Button>

        {/* 错误提示 */}
        {message.error && (
          <span className="text-xs text-error/80" role="alert">
            {message.error}
          </span>
        )}
      </div>
    );
  },
);

MessageActions.displayName = 'MessageActions';
