import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/providers/query.provider';
import { clearSDK } from './sdk-cleanup.util';
import { resetComposerDraftStore } from '@/store/draft.store';

// Mock resetComposerDraftStore
vi.mock('@/store/draft.store', () => ({
  resetComposerDraftStore: vi.fn(),
}));

describe('clearSDK', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('clearStorage=true 时应清理旧版和按渠道分桶的草稿缓存', () => {
    localStorage.setItem('bifrost-chat-draft', 'legacy');
    localStorage.setItem(
      'bifrost-chat-draft-conversation-conv-1-channel-whatsapp',
      'draft-1',
    );
    localStorage.setItem('bifrost-chat-draft-channel-email', 'draft-2');
    localStorage.setItem('other-key', 'keep');

    clearSDK({ clearStorage: true });

    expect(localStorage.getItem('bifrost-chat-draft')).toBeNull();
    expect(
      localStorage.getItem(
        'bifrost-chat-draft-conversation-conv-1-channel-whatsapp',
      ),
    ).toBeNull();
    expect(localStorage.getItem('bifrost-chat-draft-channel-email')).toBeNull();
    expect(localStorage.getItem('other-key')).toBe('keep');
  });

  it('clearStorage=true 时应清理新的 Zustand 草稿存储', () => {
    localStorage.setItem(
      'bifrost-drafts',
      JSON.stringify({ state: { drafts: {} }, version: 0 }),
    );
    localStorage.setItem('other-key', 'keep');

    clearSDK({ clearStorage: true });

    expect(localStorage.getItem('bifrost-drafts')).toBeNull();
    expect(localStorage.getItem('other-key')).toBe('keep');
  });

  it('应调用 resetComposerDraftStore 清理 Zustand 草稿 store', () => {
    clearSDK();

    expect(resetComposerDraftStore).toHaveBeenCalledTimes(1);
  });

  it('应清理传入 QueryClient 的缓存', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.messages.list('conv-1'), {
      pages: [{ items: [] }],
      pageParams: [],
    });

    clearSDK({ queryClient });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('clearStorage=true 且提供离线队列时应一并清理队列', async () => {
    const offlineMessageQueue = {
      clear: vi.fn().mockResolvedValue(undefined),
    };

    clearSDK({
      clearStorage: true,
      offlineMessageQueue,
    });

    await Promise.resolve();

    expect(offlineMessageQueue.clear).toHaveBeenCalledTimes(1);
  });

  it('clearStorage=false 时不应触发离线队列清理', async () => {
    const offlineMessageQueue = {
      clear: vi.fn().mockResolvedValue(undefined),
    };

    clearSDK({
      clearStorage: false,
      offlineMessageQueue,
    });

    await Promise.resolve();

    expect(offlineMessageQueue.clear).not.toHaveBeenCalled();
  });
});
