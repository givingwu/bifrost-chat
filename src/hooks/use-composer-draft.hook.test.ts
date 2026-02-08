import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useComposerDraft } from './use-composer-draft.hook';

describe('useComposerDraft', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('基础功能', () => {
    it('应该保存草稿到 localStorage', async () => {
      const { result } = renderHook(() =>
        useComposerDraft('test-key', 'hello', {
          debounceDelay: 100,
        }),
      );

      await waitFor(
        () => {
          expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe(
            'hello',
          );
        },
        { timeout: 500 },
      );
    });

    it('应该加载草稿', () => {
      const { result } = renderHook(() => useComposerDraft('test-key', ''));

      // 在 renderHook 之后设置草稿
      act(() => {
        window.localStorage.setItem(
          'bifrost-chat-draft-test-key',
          'saved draft',
        );
      });

      // 验证草稿已设置
      expect(window.localStorage.getItem('bifrost-chat-draft-test-key')).toBe(
        'saved draft',
      );

      // loadDraft 是同步方法，直接调用即可
      const draft = result.current.loadDraft();
      expect(draft).toBe('saved draft');
    });

    it('应该清除草稿', () => {
      localStorage.setItem('bifrost-chat-draft-test-key', 'draft');

      const { result } = renderHook(() =>
        useComposerDraft('test-key', 'draft'),
      );

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();
    });

    it('应该检测是否存在草稿', () => {
      const { result } = renderHook(() => useComposerDraft('test-key', ''));

      expect(result.current.hasDraft()).toBe(false);

      localStorage.setItem('bifrost-chat-draft-test-key', 'draft');

      expect(result.current.hasDraft()).toBe(true);
    });

    it('应该立即保存草稿（跳过防抖）', () => {
      const { result } = renderHook(() =>
        useComposerDraft('test-key', 'immediate save'),
      );

      act(() => {
        result.current.saveDraft();
      });

      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe(
        'immediate save',
      );
    });
  });

  describe('防抖功能', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在防抖延迟后保存草稿', () => {
      const { result } = renderHook(() =>
        useComposerDraft('test-key', 'debounced', {
          debounceDelay: 500,
        }),
      );

      // 立即检查，应该还未保存
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();

      // 快进时间
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // 现在应该已经保存
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe(
        'debounced',
      );
    });

    it('应该在值变化时重置防抖定时器', () => {
      const { rerender } = renderHook(
        ({ value }) =>
          useComposerDraft('test-key', value, { debounceDelay: 500 }),
        { initialProps: { value: 'first' } },
      );

      // 快进 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 更新值，应该重置定时器
      rerender({ value: 'second' });

      // 再快进 300ms（总共 600ms），但定时器被重置了
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 应该还未保存
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();

      // 再快进 200ms（第二次更新的 500ms）
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // 现在应该已经保存
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe(
        'second',
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理 localStorage 配额超限错误', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        (error as { name?: string }).name = 'QuotaExceededError';
        throw error;
      });

      const onError = vi.fn();
      renderHook(() =>
        useComposerDraft('test-key', 'x'.repeat(10000000), {
          debounceDelay: 100,
          onSaveError: onError,
        }),
      );

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      const error = onError.mock.calls[0][0];
      expect(error.name).toBe('QuotaExceededError');

      Storage.prototype.setItem = originalSetItem;
    });

    it('应该处理其他保存错误', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const onError = vi.fn();
      renderHook(() =>
        useComposerDraft('test-key', 'test', {
          debounceDelay: 100,
          onSaveError: onError,
        }),
      );

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      Storage.prototype.setItem = originalSetItem;
    });

    it('应该处理加载草稿错误', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useComposerDraft('test-key', '', {
          onSaveError: onError,
        }),
      );

      const draft = result.current.loadDraft();
      expect(draft).toBe('');
      expect(onError).toHaveBeenCalled();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('回调函数', () => {
    it('应该在保存成功时调用 onSave 回调', async () => {
      const onSave = vi.fn();

      renderHook(() =>
        useComposerDraft('test-key', 'test', {
          debounceDelay: 100,
          onSave,
        }),
      );

      await waitFor(
        () => {
          expect(onSave).toHaveBeenCalledWith('test');
        },
        { timeout: 500 },
      );
    });

    it('应该在清除草稿时调用 onSaveError 回调（如果出错）', () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useComposerDraft('test-key', 'test', {
          onSaveError: onError,
        }),
      );

      act(() => {
        result.current.clearDraft();
      });

      expect(onError).toHaveBeenCalled();

      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('组件卸载', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在组件卸载时清除定时器', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = renderHook(() =>
        useComposerDraft('test-key', 'test', {
          debounceDelay: 500,
        }),
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('应该在组件卸载时清除草稿（如果配置了）', () => {
      const { unmount } = renderHook(() =>
        useComposerDraft('test-key', 'test', {
          clearOnUnmount: true,
        }),
      );

      // 先保存草稿
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe('test');

      // 卸载组件
      unmount();

      // 草稿应该被清除
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();
    });

    it('不应该在组件卸载时清除草稿（如果未配置）', () => {
      const { unmount } = renderHook(() =>
        useComposerDraft('test-key', 'test', {
          clearOnUnmount: false,
        }),
      );

      // 先保存草稿
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe('test');

      // 卸载组件
      unmount();

      // 草稿应该保留
      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBe('test');
    });
  });

  describe('边界情况', () => {
    it('应该处理空 key', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useComposerDraft('', 'test'));

      const draft = result.current.loadDraft();
      expect(draft).toBe('');

      act(() => {
        result.current.saveDraft();
      });

      expect(localStorage.getItem('bifrost-chat-draft-')).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it('应该处理空值', () => {
      vi.useFakeTimers();

      localStorage.setItem('bifrost-chat-draft-test-key', 'old draft');

      const { result } = renderHook(() => useComposerDraft('test-key', ''));

      // 空值应该清除草稿
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(localStorage.getItem('bifrost-chat-draft-test-key')).toBeNull();

      vi.useRealTimers();
    });

    it('应该处理 initialValueLoaded 标志', () => {
      const { result } = renderHook(() => useComposerDraft('test-key', ''));

      expect(result.current.initialValueLoaded).toBe(false);

      act(() => {
        result.current.loadDraft();
      });

      // loadDraft 后应该设置为 true
      expect(result.current.initialValueLoaded).toBe(true);
    });
  });

  describe('SSR 兼容性', () => {
    it('应该在非浏览器环境中优雅失败', () => {
      // 模拟非浏览器环境 - 通过修改 window.localStorage 来模拟
      const originalLocalStorage = window.localStorage;
      // @ts-expect-error - 测试非浏览器环境
      delete window.localStorage;

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useComposerDraft('test-key', 'test'));

      // 应该不抛出错误
      expect(result.current.loadDraft()).toBe('');

      consoleErrorSpy.mockRestore();

      // 恢复 localStorage
      window.localStorage = originalLocalStorage;
    });
  });
});
