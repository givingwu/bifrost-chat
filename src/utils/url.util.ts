/**
 * URL 验证工具
 */

/**
 * 验证 URL 是否有效
 * @param url - 待验证的 URL 字符串
 * @returns 是否为有效的 URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // 必须有协议（http、https、ftp 等）
    return urlObj.protocol.includes('http');
  } catch {
    return false;
  }
};

/**
 * 验证 URL 是否为有效的 HTTP(S) 链接
 * @param url - 待验证的 URL 字符串
 * @returns 是否为有效的 HTTP(S) 链接
 */
export const isValidHttpUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 获取文件名的安全版本
 * @param url - URL 字符串
 * @param fallback - 回退文件名
 * @returns 安全的文件名
 */
export const getSafeFileName = (
  url: string,
  fallback = 'Unknown file',
): string => {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop();
    return fileName || fallback;
  } catch {
    return fallback;
  }
};
