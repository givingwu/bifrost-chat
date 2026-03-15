import type { QueryClient } from '@tanstack/react-query';
import {
  clearQueryCache,
  defaultQueryClient,
} from '@/providers/query.provider';
import type { OfflineMessageQueueService } from '@/services/messaging/offline-message-queue.service';
import { resetChatStore } from '@/store';

const LEGACY_DRAFT_STORAGE_KEY = 'bifrost-chat-draft';
const DRAFT_STORAGE_KEY_PREFIX = 'bifrost-chat-draft-';

function clearDraftStorage(storage: Storage) {
  const draftKeys = new Set<string>();

  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);

    if (!key) {
      continue;
    }

    if (
      key === LEGACY_DRAFT_STORAGE_KEY ||
      key.startsWith(DRAFT_STORAGE_KEY_PREFIX)
    ) {
      draftKeys.add(key);
    }
  }

  for (const key of draftKeys) {
    storage.removeItem(key);
  }
}

export interface CleanupOptions {
  /** QueryClient 实例（可选） */
  queryClient?: QueryClient;
  /** 是否清理 localStorage（默认 false） */
  clearStorage?: boolean;
  /** 离线消息队列实例（可选，clearStorage=true 时一并清理） */
  offlineMessageQueue?: Pick<OfflineMessageQueueService, 'clear'>;
}

/**
 * 清理 SDK 状态和缓存。
 *
 * @deprecated 为了兼容既有接入方继续保留。
 * 新接入建议显式组合 `resetChatStore()` 与 `clearQueryCache(queryClient)`。
 */
export function clearSDK(options: CleanupOptions = {}) {
  const {
    queryClient = defaultQueryClient,
    clearStorage = false,
    offlineMessageQueue,
  } = options;

  resetChatStore();
  clearQueryCache(queryClient);

  if (!clearStorage || typeof window === 'undefined') {
    return;
  }

  clearDraftStorage(window.localStorage);

  if (!offlineMessageQueue) {
    return;
  }

  void offlineMessageQueue.clear().catch((error: unknown) => {
    console.error('[clearSDK] Failed to clear offline message queue:', error);
  });
}
