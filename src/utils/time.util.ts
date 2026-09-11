/**
 * 翻译函数类型（与 useTranslation 返回的 t 兼容）
 */
type TranslateFunction = (
  key: string,
  params?: Record<string, unknown>,
) => string;

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a timestamp into a relative time string.
 *
 * | 时间差        | en-US         | zh-CN        |
 * |-------------|---------------|-------------|
 * | < 60s       | just now      | 刚刚         |
 * | < 60min     | Xm ago        | X分钟前       |
 * | < 24h       | Xh ago        | X小时前       |
 * | < 48h       | yesterday     | 昨天          |
 * | < 7d        | Xd ago        | X天前         |
 * | >= 7d       | toLocaleString| toLocaleString|
 *
 * @param timestamp - Unix timestamp in ms or ISO string
 * @param t - i18n translate function
 * @param locale - locale string for fallback formatting
 */
export const formatRelativeTime = (
  timestamp: number | string,
  t: TranslateFunction,
  locale: string = 'zh-CN',
): string | undefined => {
  if (!timestamp) return undefined;

  const date =
    typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = Date.now();
  const diff = now - date.getTime();

  // 未来时间或无效时间
  if (diff < 0 || Number.isNaN(diff)) {
    return t('time.justNow');
  }

  if (diff < MINUTE) {
    return t('time.justNow');
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return t('time.minutesAgo', { count: minutes });
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return t('time.hoursAgo', { count: hours });
  }

  if (diff < 2 * DAY) {
    return t('time.yesterday');
  }

  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return t('time.daysAgo', { count: days });
  }

  // 超过 7 天：回退到绝对时间
  return date.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
