import type { StandardMessage } from '@/interfaces/message.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { MessageRendererFactory } from './MessageRendererFactory';

export interface MessageListProps {
  /** 消息流 */
  messages: StandardMessage[];
}

/**
 * MessageList：消息列表组件
 *
 * @description
 * 渲染消息列表，使用 MessageRendererFactory 根据消息类型渲染不同的消息组件。
 * 支持虚拟滚动（预留）。
 *
 * @example
 * ```tsx
 * <MessageList messages={messages} />
 * ```
 */
export const MessageList = ({ messages }: MessageListProps) => {
  const { t } = useTranslation();

  return (
    <div
      data-component="message-list"
      className="flex h-full flex-col gap-2 rounded-2xl bg-card/60 shadow-soft"
    >
      {messages.length ? (
        messages.map((message) => (
          <MessageRendererFactory
            key={message.id ?? message.tempId}
            message={message}
          />
        ))
      ) : (
        <div className="flex h-full flex-1 items-center justify-center">
          <span className="text-sm text-text-muted">{t('message.empty')}</span>
        </div>
      )}
    </div>
  );
};
