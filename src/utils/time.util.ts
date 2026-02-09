/**
 * Format a timestamp into a human-readable time string.
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (
  timestamp: number,
  locale: string = 'zh-CN',
) => {
  if (!timestamp) return;

  const date = new Date(timestamp);

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a seconds to mm:ss
 * @param seconds
 * @returns
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
