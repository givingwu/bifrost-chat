import { memo, useEffect, useRef } from 'react';
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
 * 使用 React.memo 优化 MessageBubble 组件
 * 只有当 message、conversationId 或 onInViewport 发生变化时才重新渲染
 *
 * MessageBubble：消息气泡组件
 * - 组合消息内容、状态指示器和时间戳
 * - 根据消息方向和类型应用不同的样式
 * - 使用 React.memo 优化渲染性能
 */
export const MessageBubble = memo(
  ({ message, conversationId, onInViewport }: MessageBubbleProps) => {
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
        className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
      >
        <div
          className={cn(
            'flex max-w-[70%] flex-col',
            isMe ? 'items-end' : 'items-start',
          )}
        >
          <div
            className={cn(
              'relative px-4 py-2.5 text-sm rounded-2xl shadow-soft wrap-anywhere max-w-full',
              isMe
                ? 'rounded-tr-sm bg-primary text-primary-foreground'
                : 'rounded-tl-sm border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              message.type === MessageTypeEnum.Template &&
                'overflow-hidden p-0',
            )}
          >
            <MessageContentRenderer message={message} />
          </div>
          <div className="mt-1 flex items-center gap-1 px-1">
            {isMe && (
              <>
                <StatusIndicator status={message.status} />
                {message.status === MessageStatusEnum.Failed && (
                  <>
                    {/* 服务端失败消息：显示错误信息 */}
                    {message._source === 'server' && message.error && (
                      <span className="text-xs text-error/80" role="alert">
                        {message.error instanceof Error
                          ? message.error.message
                          : message.error}
                      </span>
                    )}
                    {/* 本地失败消息：显示操作按钮 */}
                    {message._offlineMessageId && (
                      <MessageActions
                        message={message}
                        conversationId={conversationId}
                      />
                    )}
                  </>
                )}
              </>
            )}
            <MessageTimestamp timestamp={message.timestamp} />
            {!isMe && (
              <>
                {message.status === MessageStatusEnum.Failed && (
                  <>
                    {/* 服务端失败消息：显示错误信息 */}
                    {message._source === 'server' && message.error && (
                      <span className="text-xs text-error/80" role="alert">
                        {message.error instanceof Error
                          ? message.error.message
                          : message.error}
                      </span>
                    )}
                    {/* 本地失败消息：显示操作按钮 */}
                    {message._offlineMessageId && (
                      <MessageActions
                        className="flex-row-reverse"
                        message={message}
                        conversationId={conversationId}
                      />
                    )}
                  </>
                )}
                <StatusIndicator status={message.status} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 比较 message 对象的关键属性
    const prevMessage = prevProps.message;
    const nextMessage = nextProps.message;

    // 如果 message 引用相同，直接返回 true（不需要重新渲染）
    if (prevMessage === nextMessage) {
      return true;
    }

    // 比较 message 的关键属性
    return (
      prevMessage.id === nextMessage.id &&
      prevMessage.tempId === nextMessage.tempId &&
      prevMessage.status === nextMessage.status &&
      prevMessage.direction === nextMessage.direction &&
      prevMessage.type === nextMessage.type &&
      prevMessage.timestamp === nextMessage.timestamp &&
      prevProps.conversationId === nextProps.conversationId &&
      prevProps.onInViewport === nextProps.onInViewport
    );
  },
);

MessageBubble.displayName = 'MessageBubble';
