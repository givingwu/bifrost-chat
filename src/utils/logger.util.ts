/**
 * SDK 内部日志工具
 *
 * @description
 * 受 SDK 配置中 `debug` 字段控制，避免在宿主应用控制台产生噪音。
 * 所有 SDK 内部日志必须通过此模块输出，禁止直接使用 `console.*`。
 *
 * 使用方式：
 * ```typescript
 * import { logger } from '@/utils/logger.util';
 *
 * logger.info('[useMessages] 消息加载完成', { count: 10 });
 * logger.warn('[useSendMessage] 超时，回滚消息');
 * logger.error('[MessageQueue] 发送失败', error);
 * ```
 *
 * 启用调试日志：
 * 在 `SDKConfig` 中设置 `debug: true`，或在开发环境设置
 * `localStorage.setItem('bifrost:debug', 'true')` 临时开启。
 */

function isDebugEnabled(): boolean {
  try {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('bifrost:debug') === 'true'
    );
  } catch {
    return false;
  }
}

let _debug = process.env.NODE_ENV === 'development' || isDebugEnabled();

/**
 * 设置全局 debug 模式（由 SDK 初始化时调用）
 */
export function setLoggerDebug(enabled: boolean): void {
  _debug = enabled;
}

export const logger = {
  info: (...args: unknown[]): void => {
    if (_debug) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (_debug) {
      console.warn(...args);
    }
  },
  /**
   * error 级别日志始终输出（不受 debug 控制），因为错误信息对排查生产问题至关重要。
   * SDK 宿主如需过滤，可通过 `window.onerror` 或自定义 ErrorBoundary 处理。
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  debug: (...args: unknown[]): void => {
    if (_debug) {
      console.debug(...args);
    }
  },
};
