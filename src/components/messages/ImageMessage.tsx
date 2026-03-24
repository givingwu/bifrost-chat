import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import type { MessageContent } from '@/interfaces/message.interface';
import { isValidHttpUrl } from '@/utils/url.util';
import { EmptyMessage } from './EmptyMessage';
import { InvalidUrlMessage } from './InvalidUrlMessage';

export interface ImageMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * 默认占位图片（SVG Data URI）
 */
const DEFAULT_IMAGE_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';

/**
 * ImageMessage：图片消息组件。
 * - 渲染图片消息，支持 URL 显示。
 * - 验证 URL 有效性，无效时显示错误状态。
 * - 图片加载失败时显示占位图。
 */
export const ImageMessage = ({ content }: ImageMessageProps) => {
  const [imageError, setImageError] = useState(false);

  if (!('url' in content)) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl border border-border bg-card">
        <EmptyMessage icon={ImageOff} type="image" />
      </div>
    );
  }

  if (!content.url || content.url.trim() === '') {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl border border-border bg-card">
        <EmptyMessage icon={ImageOff} type="image" />
      </div>
    );
  }

  if (!isValidHttpUrl(content.url)) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl border border-border bg-card">
        <InvalidUrlMessage icon={ImageOff} compact type="image" />
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="flex h-40 w-56 items-center justify-center rounded-xl border border-border bg-card">
        <img
          src={DEFAULT_IMAGE_URL}
          alt="placeholder"
          className="h-40 w-56 rounded-xl object-cover opacity-50"
        />
      </div>
    );
  }

  return (
    <img
      src={content.url}
      alt="message"
      className="h-40 w-56 rounded-xl object-cover"
      onError={() => setImageError(true)}
    />
  );
};
