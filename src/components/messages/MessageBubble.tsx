import { useEffect, useRef } from 'react';
import { useInViewport } from '@/hooks/use-in-viewport.hook';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { cn } from '@/utils/class.util';
import { MessageActions } from './MessageActions';
import { MessageContentRenderer } from './MessageContentRenderer';
import { MessageTimestamp } from './MessageTimestamp';
import { StatusIndicator } from './StatusIndicator';

export interface MessageBubbleProps {
  /** 标准消息 */
  message: StandardMessage;
  /** 会话 ID */
  conversationId?: string;
  /** 消息进入视口时触发 */
  onInViewport?: (message: StandardMessage) => void;
}

/**
 * MessageBubble：消息气泡组件
 * - 组合消息内容、状态指示器和时间戳
 * - 根据消息方向和类型应用不同的样式
 */
export const MessageBubble = ({
  message,
  conversationId,
  onInViewport,
}: MessageBubbleProps) => {
  const isMe = message.direction === MessageDirectionEnum.Outgoing;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef(message);
  const [inViewport] = useInViewport(bubbleRef, {
    threshold: 0.15,
  });

  useEffect(() => {
    latestMessageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (!inViewport || !onInViewport) return;
    onInViewport(latestMessageRef.current);
  }, [inViewport, onInViewport]);

  return (
    <div
      ref={bubbleRef}
      data-component="message-bubble"
      data-message-status={message.status}
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
            'relative px-4 py-2.5 text-sm rounded-2xl shadow-soft wrap-break-words',
            isMe
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            message.type === MessageTypeEnum.Template && 'overflow-hidden p-0',
          )}
        >
          <MessageContentRenderer message={message} />
        </div>
        <div className="mt-1 flex items-center gap-1 px-1">
          {isMe && (
            <>
              <StatusIndicator status={message.status} />
              {message.status === MessageStatusEnum.Failed && (
                <MessageActions
                  message={message}
                  conversationId={conversationId}
                />
              )}
            </>
          )}
          <MessageTimestamp timestamp={message.timestamp} />
          {!isMe && (
            <>
              {message.status === MessageStatusEnum.Failed && (
                <MessageActions
                  className="flex-row-reverse"
                  message={message}
                  conversationId={conversationId}
                />
              )}
              <StatusIndicator status={message.status} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
