import type { QueryClient } from '@tanstack/react-query';
import {
  clearQueryCache,
  defaultQueryClient,
} from '@/providers/query.provider';
import { resetChatStore } from '@/store';

export interface CleanupOptions {
  /** QueryClient 实例（可选） */
  queryClient?: QueryClient;
  /** 是否清理 localStorage（默认 false） */
  clearStorage?: boolean;
}

/**
 * 清理 SDK 状态和缓存。
 *
 * @deprecated 为了兼容既有接入方继续保留。
 * 新接入建议显式组合 `resetChatStore()` 与 `clearQueryCache(queryClient)`。
 */
export function clearSDK(options: CleanupOptions = {}) {
  const { queryClient = defaultQueryClient, clearStorage = false } = options;

  resetChatStore();
  clearQueryCache(queryClient);

  if (clearStorage) {
    localStorage.removeItem('bifrost-chat-draft');
  }
}
