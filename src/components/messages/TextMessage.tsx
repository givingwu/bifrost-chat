import { MessageSquare } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';
import { EmptyMessage } from './EmptyMessage';

export interface TextMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * TextMessage：文本消息组件。
 * - 渲染纯文本消息。
 * - 无文本时显示友好提示。
 */
export const TextMessage = ({ content }: TextMessageProps) => {
  if (!('text' in content) || !content.text || content.text.trim() === '') {
    return <EmptyMessage icon={MessageSquare} type="text" />;
  }

  return <p className="leading-relaxed">{content.text}</p>;
};
