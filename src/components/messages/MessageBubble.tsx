import { Bot } from 'lucide-react';
import { memo, useEffect, useRef } from 'react';
import { useInViewport } from '@/hooks/use-in-viewport.hook';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import { PacketSenderTypeEnum } from '@/interfaces/protocol.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { MessageActions } from './MessageActions';
import { MessageContentRenderer } from './MessageContentRenderer';
import { MessageTimestamp } from './MessageTimestamp';
import { StatusIndicator } from './StatusIndicator';

/**
 * 提取通道账号尾号。
 *
 * @description
 * 优先展示账号中的最后 4 位数字；如果账号被脱敏导致不足 4 位数字，
 * 则退回展示去空白后的最后 4 个字符。
 *
 * @param value Packet metadata.channelAccount 原始值
 * @returns 可展示的账号尾号；无有效账号时返回 undefined
 */
function getChannelAccountTail(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const compactValue = String(value).trim().replace(/\s+/g, '');
  if (!compactValue) {
    return undefined;
  }

  const digits = compactValue.replace(/\D/g, '');
  const tailSource = digits.length >= 4 ? digits : compactValue;

  return tailSource.slice(-4);
}

/**
 * 判断消息是否为 Chatbot 外发消息。
 *
 * @description
 * Packet 协议转换层会将 senderType 归一化为 PacketSenderTypeEnum。
 * UI 仅在外发消息上展示 Chatbot 标识，避免客户侧消息误标。
 *
 * @param senderType Packet metadata.senderType 规范枚举值
 * @param isOutgoing 当前消息是否为外发消息
 * @returns 是否展示 Chatbot 标识
 */
function isChatbotOutgoingMessage(
  senderType: unknown,
  isOutgoing: boolean,
): boolean {
  if (!isOutgoing) {
    return false;
  }

  return senderType === PacketSenderTypeEnum.Chatbot;
}

/**
 * 提取影响 MessageBubble 尾部标识的 metadata 签名。
 *
 * @description
 * React.memo 只比较关键字段；metadata 引用变化时需要确保发送号码和
 * Chatbot 标识能触发重渲染。
 *
 * @param message 标准消息
 * @returns 尾部标识签名
 */
function getMessageMetadataSignature(message: StandardMessage): string {
  const isOutgoing = message.direction === MessageDirectionEnum.Outgoing;
  const accountTail = getChannelAccountTail(message.metadata?.channelAccount);
  const chatbot = isChatbotOutgoingMessage(
    message.metadata?.senderType,
    isOutgoing,
  );

  return `${accountTail ?? ''}:${chatbot ? 'bot' : 'human'}`;
}

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
    const { t } = useTranslation();
    const channelAccountTail = getChannelAccountTail(
      message.metadata?.channelAccount,
    );
    const isChatbotMessage = isChatbotOutgoingMessage(
      message.metadata?.senderType,
      isMe,
    );
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
          <div className="mt-1 flex flex-wrap items-center gap-1 px-1">
            {isMe ? (
              <>
                <MessageTimestamp timestamp={message.timestamp} />
                <StatusIndicator status={message.status} showLabel />
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
                {isChatbotMessage && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-text-muted">
                    <Bot className="h-3 w-3" aria-hidden="true" />
                    {t('message.chatbot')}
                  </span>
                )}
                {channelAccountTail && (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-text-muted">
                    {t('message.channelAccountTail', {
                      tail: channelAccountTail,
                    })}
                  </span>
                )}
              </>
            ) : (
              <>
                {channelAccountTail && (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-text-muted">
                    {t('message.channelAccountTail', {
                      tail: channelAccountTail,
                    })}
                  </span>
                )}
                {isChatbotMessage && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-text-muted">
                    <Bot className="h-3 w-3" aria-hidden="true" />
                    {t('message.chatbot')}
                  </span>
                )}
                <MessageTimestamp timestamp={message.timestamp} />
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
                <StatusIndicator status={message.status} showLabel />
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
      getMessageMetadataSignature(prevMessage) ===
        getMessageMetadataSignature(nextMessage) &&
      prevProps.conversationId === nextProps.conversationId &&
      prevProps.onInViewport === nextProps.onInViewport
    );
  },
);

MessageBubble.displayName = 'MessageBubble';
