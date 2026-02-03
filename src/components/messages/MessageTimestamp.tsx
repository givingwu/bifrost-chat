import { formatTimestamp } from '@/utils/time.util';

export interface MessageTimestampProps {
  /** 时间戳（毫秒） */
  timestamp: number;
}

/**
 * MessageTimestamp：消息时间戳组件。
 * - 显示消息的发送时间。
 */
export const MessageTimestamp = ({ timestamp }: MessageTimestampProps) => {
  const time = formatTimestamp(timestamp);
  return <span className="text-[10px] text-text-muted">{time}</span>;
};
