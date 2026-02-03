import type { MessageContent } from '@/interfaces/message.interface';

export interface VoiceMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * VoiceMessage：语音消息组件。
 * - 渲染语音消息，预留实现。
 * - TODO: 添加音频播放器功能。
 */
export const VoiceMessage = ({ content }: VoiceMessageProps) => {
  if (!('url' in content)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <span className="text-xs font-medium text-primary">🎤</span>
      </div>
      <div className="flex-1">
        <div className="h-1 w-full rounded-full bg-muted">
          <div className="h-1 w-1/3 rounded-full bg-primary" />
        </div>
      </div>
      <span className="text-xs text-text-muted">0:15</span>
    </div>
  );
};
