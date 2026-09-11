import type { QueryClient } from '@tanstack/react-query';
import {
  clearQueryCache,
  defaultQueryClient,
} from '@/providers/query.provider';
import type { OfflineMessageQueueService } from '@/services/messaging/offline-message-queue.service';
import { resetChatStore } from '@/store';
import { resetComposerDraftStore } from '@/store/draft.store';

const LEGACY_DRAFT_STORAGE_KEY = 'bifrost-chat-draft';
const DRAFT_STORAGE_KEY_PREFIX = 'bifrost-chat-draft-';
const DRAFT_STORE_STORAGE_KEY = 'bifrost-drafts';

/**
 * 清理 SDK 写入到浏览器存储中的所有草稿键。
 *
 * @param storage 浏览器存储实例。
 * @returns void
 */
function clearDraftStorage(storage: Storage) {
  const draftKeys = new Set<string>();

  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);

    if (!key) {
      continue;
    }

    if (
      key === LEGACY_DRAFT_STORAGE_KEY ||
      key.startsWith(DRAFT_STORAGE_KEY_PREFIX) ||
      key === DRAFT_STORE_STORAGE_KEY
    ) {
      draftKeys.add(key);
    }
  }

  for (const key of draftKeys) {
    storage.removeItem(key);
  }
}

/**
 * `clearSDK` 的可选配置。
 *
 * @property queryClient QueryClient 实例；未传时使用默认实例。
 * @property clearStorage 是否同时清理浏览器存储中的 SDK 缓存。
 * @property offlineMessageQueue 离线消息队列实例；仅在
 * `clearStorage=true` 时触发清理。
 */
export interface CleanupOptions {
  queryClient?: QueryClient;
  clearStorage?: boolean;
  offlineMessageQueue?: Pick<OfflineMessageQueueService, 'clear'>;
}

/**
 * 清理 SDK 状态和缓存。
 *
 * @deprecated 为了兼容既有接入方继续保留。
 * 新接入建议显式组合 `resetChatStore()` 与 `clearQueryCache(queryClient)`。
 * @param options 清理配置；支持同时清空草稿缓存与离线消息队列。
 * @returns void
 */
export function clearSDK(options: CleanupOptions = {}) {
  const {
    queryClient = defaultQueryClient,
    clearStorage = false,
    offlineMessageQueue,
  } = options;

  resetChatStore();
  resetComposerDraftStore();
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
