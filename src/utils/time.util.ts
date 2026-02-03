/**
 * Format a timestamp into a human-readable time string.
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
