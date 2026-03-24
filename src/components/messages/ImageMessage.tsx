import { ImageOff } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';
import { isValidHttpUrl } from '@/utils/url.util';
import { InvalidUrlMessage } from './InvalidUrlMessage';

export interface ImageMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * ImageMessage：图片消息组件。
 * - 渲染图片消息，支持 URL 显示。
 * - 验证 URL 有效性，无效时显示错误状态。
 */
export const ImageMessage = ({ content }: ImageMessageProps) => {
  if (!('url' in content) || !isValidHttpUrl(content.url)) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl border border-border bg-card">
        <InvalidUrlMessage icon={ImageOff} compact />
      </div>
    );
  }

  return (
    <img
      src={content.url}
      alt="message"
      className="h-40 w-56 rounded-xl object-cover"
    />
  );
};
