import type { MessageContent } from '@/interfaces/message.interface';

export interface TextMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * TextMessage：文本消息组件。
 * - 渲染纯文本消息。
 */
export const TextMessage = ({ content }: TextMessageProps) => {
  if (!('text' in content)) {
    return null;
  }

  return <p className="leading-relaxed">{content.text}</p>;
};
