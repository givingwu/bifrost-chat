import type { MessageContent } from '@/interfaces/message.interface';

export interface ImageMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * ImageMessage：图片消息组件。
 * - 渲染图片消息，支持 URL 显示。
 */
export const ImageMessage = ({ content }: ImageMessageProps) => {
  if (!('url' in content)) {
    return null;
  }

  return (
    <img
      src={content.url}
      alt="message"
      className="h-40 w-56 rounded-xl object-cover"
    />
  );
};
