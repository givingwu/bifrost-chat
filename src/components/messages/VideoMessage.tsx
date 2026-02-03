import type { MessageContent } from '@/interfaces/message.interface';

export interface VideoMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * VideoMessage：视频消息组件。
 * - 渲染视频消息，支持视频播放。
 */
export const VideoMessage = ({ content }: VideoMessageProps) => {
  if (!('url' in content)) {
    return null;
  }

  return (
    <div className="relative h-40 w-56 overflow-hidden rounded-xl">
      {/* biome-ignore lint: 字幕轨道将由用户提供 */}
      <video
        src={content.url}
        controls
        className="h-full w-full object-cover"
      />
    </div>
  );
};
