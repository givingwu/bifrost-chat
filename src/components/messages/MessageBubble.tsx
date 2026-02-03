import {
  MessageDirection,
  MessageStatus,
  MessageType,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { cn } from '@/utils/class.util';
import { MessageContentRenderer } from './MessageContentRenderer';
import { MessageTimestamp } from './MessageTimestamp';
import { StatusIndicator } from './StatusIndicator';

export interface MessageBubbleProps {
  /** 标准消息 */
  message: StandardMessage;
}

/**
 * MessageBubble：消息气泡组件
 * - 组合消息内容、状态指示器和时间戳
 * - 根据消息方向和类型应用不同的样式
 */
export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.direction === MessageDirection.Outgoing;

  return (
    <div
      data-component="message-bubble"
      data-type={message.type}
      className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'flex max-w-[70%] flex-col',
          isMe ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'relative px-4 py-2.5 text-sm shadow-soft rounded-2xl',
            isMe
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-border bg-card text-text',
            message.type === MessageType.Template && 'overflow-hidden p-0',
          )}
        >
          <MessageContentRenderer message={message} />
        </div>
        <div className="mt-1 flex items-center gap-1 px-1">
          {message.status === MessageStatus.Failed && (
            <span className="text-xs font-medium text-error">Retry</span>
          )}
          <MessageTimestamp timestamp={message.timestamp} />
          {isMe && <StatusIndicator status={message.status} />}
        </div>
      </div>
    </div>
  );
};
