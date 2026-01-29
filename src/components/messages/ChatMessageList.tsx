import type { StandardMessage } from '@/interfaces/message.interface';
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
      className="flex h-full flex-col gap-2 overflow-y-auto rounded-2xl border border-border bg-card/60 p-4 shadow-soft"
    >
      {messages.map((message) => (
        <MessageRendererFactory key={message.id} message={message} />
      ))}
    </div>
  );
};
