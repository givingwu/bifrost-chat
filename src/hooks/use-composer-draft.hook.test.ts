import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useComposerDraft } from './use-composer-draft.hook';

describe('useComposerDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应在挂载时加载当前会话草稿', async () => {
    localStorage.setItem(
      'bifrost-chat-draft-conversation-conv-load',
      'saved draft',
    );

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-load',
      }),
    );

    await waitFor(() => {
      expect(result.current.value).toBe('saved draft');
    });
  });

  it('应按防抖配置保存草稿', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-save',
        draftDebounceDelay: 200,
      }),
    );

    act(() => {
      result.current.setValue('draft content');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(
      localStorage.getItem('bifrost-chat-draft-conversation-conv-save'),
    ).toBe('draft content');
  });

  it('发送成功后应清空输入并删除草稿', async () => {
    vi.useFakeTimers();
    const onSend = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useComposerDraft({
        conversationId: 'conv-send',
        onSend,
        clearDraftOnSend: true,
      }),
    );

    act(() => {
      result.current.setValue('will send');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await act(async () => {
      await result.current.handleSend('will send');
    });

    expect(onSend).toHaveBeenCalledWith('will send', undefined);
    expect(result.current.value).toBe('');
    expect(
      localStorage.getItem('bifrost-chat-draft-conversation-conv-send'),
    ).toBeNull();
  });

  it('keepDraftOnSwitch=false 时切换会话应清理旧会话草稿', async () => {
    const key1 = 'bifrost-chat-draft-conversation-conv-1';
    const key2 = 'bifrost-chat-draft-conversation-conv-2';
    localStorage.setItem(key1, 'draft-1');

    const { result, rerender } = renderHook(
      ({ conversationId }) =>
        useComposerDraft({
          conversationId,
          keepDraftOnSwitch: false,
        }),
      { initialProps: { conversationId: 'conv-1' } },
    );

    await waitFor(() => {
      expect(result.current.value).toBe('draft-1');
    });

    rerender({ conversationId: 'conv-2' });

    await waitFor(() => {
      expect(result.current.value).toBe('');
    });
    expect(localStorage.getItem(key1)).toBeNull();
    expect(localStorage.getItem(key2)).toBeNull();
  });
});
