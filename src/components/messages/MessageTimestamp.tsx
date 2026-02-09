import { useLanguage } from '@/store';
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
  const { code: languageCode } = useLanguage();
  const time = formatTimestamp(timestamp, languageCode);

  return (
    <span className="text-[10px] text-gray-400 dark:text-gray-500">{time}</span>
  );
};
