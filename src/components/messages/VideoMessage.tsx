import { FileText } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';
import { isValidHttpUrl } from '@/utils/url.util';
import { InvalidUrlMessage } from './InvalidUrlMessage';

export interface VideoMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * VideoMessage：视频消息组件。
 * - 渲染视频消息，支持视频播放。
 * - 验证 URL 有效性，无效时显示错误状态。
 */
export const VideoMessage = ({ content }: VideoMessageProps) => {
  if (!('url' in content) || !isValidHttpUrl(content.url)) {
    return <InvalidUrlMessage icon={FileText} />;
  }

  return (
    <div className="relative w-56 overflow-hidden rounded-xl">
      {/* biome-ignore lint: 字幕轨道将由用户提供 */}
      <video
        src={content.url}
        controls
        className="h-full w-full object-cover"
      />
    </div>
  );
};
