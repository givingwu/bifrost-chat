import type { StandardMessage } from '@/interfaces/chat.interface';
import { MessageRendererFactory } from './MessageRendererFactory';

export interface ChatMessageListProps {
  /** 消息流 */
  messages: StandardMessage[];
}

/**
 * ChatMessageList：消息列表骨架（虚拟滚动预留）。
 */
export const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  return (
    <div
      data-component="chat-message-list"
      className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft"
    >
      {messages.map((message) => (
        <MessageRendererFactory key={message.id} message={message} />
      ))}
    </div>
  );
};
