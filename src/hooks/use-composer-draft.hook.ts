import { useCallback, useEffect, useRef } from 'react';

/**
 * 草稿 Hook 配置选项
 */
interface ComposerDraftOptions {
  /** 防抖延迟时间（毫秒），默认 500ms */
  debounceDelay?: number;
  /** 是否在组件卸载时自动清除草稿，默认 false */
  clearOnUnmount?: boolean;
  /** 保存成功回调 */
  onSave?: (value: string) => void;
  /** 保存失败回调 */
  onSaveError?: (error: Error) => void;
}

/**
 * 草稿 Hook 返回值
 */
interface ComposerDraftReturn {
  /** 从 localStorage 加载草稿 */
  loadDraft: () => string;
  /** 清除草稿 */
  clearDraft: () => void;
  /** 立即保存草稿（跳过防抖） */
  saveDraft: () => void;
  /** 检查是否存在草稿 */
  hasDraft: () => boolean;
  /** 是否已加载初始值 */
  initialValueLoaded: boolean;
}

/**
 * localStorage 键名前缀
 */
const DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';

/**
 * 检查是否在浏览器环境中运行
 */
const isBrowser =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * 草稿自动保存 Hook
 *
 * 自动将输入框内容保存到 localStorage，支持防抖、错误处理和 SSR
 *
 * @param key - 存储键名（会自动添加前缀）
 * @param value - 当前输入值
 * @param options - 配置选项
 * @returns 草稿操作方法集合
 *
 * @example
 * ```tsx
 * const { loadDraft, clearDraft, saveDraft, hasDraft } = useComposerDraft(
 *   'conversation-123',
 *   message,
 *   {
 *     debounceDelay: 500,
 *     onSave: (value) => console.log('Draft saved:', value),
 *     onSaveError: (error) => console.error('Save failed:', error),
 *   }
 * );
 * ```
 */
export function useComposerDraft(
  key: string,
  value: string,
  options: ComposerDraftOptions = {},
): ComposerDraftReturn {
  const {
    debounceDelay = 500,
    clearOnUnmount = false,
    onSave,
    onSaveError,
  } = options;

  // 使用 number 类型以兼容浏览器环境
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const lastSavedValueRef = useRef<string>('');
  const initialValueLoadedRef = useRef(false);

  // 生成完整的存储键名
  const storageKey = `${DRAFT_KEY_PREFIX}${key}`;

  // 加载草稿
  const loadDraft = useCallback((): string => {
    if (!isBrowser) {
      return '';
    }

    if (!key) {
      console.warn('[useComposerDraft] key is empty');
      return '';
    }

    try {
      const draft = localStorage.getItem(storageKey);
      initialValueLoadedRef.current = true;
      return draft ?? '';
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[useComposerDraft] Failed to load draft:', err.message);
      onSaveError?.(err);
      return '';
    }
  }, [storageKey, key, onSaveError]);

  // 清除草稿
  const clearDraft = useCallback((): void => {
    if (!isBrowser) {
      return;
    }

    if (!key) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
      lastSavedValueRef.current = '';
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[useComposerDraft] Failed to clear draft:', err.message);
      onSaveError?.(err);
    }
  }, [storageKey, key, onSaveError]);

  // 保存草稿（内部方法）
  const performSave = useCallback(
    (valToSave: string) => {
      if (!isBrowser) {
        return;
      }

      if (!key) {
        console.warn('[useComposerDraft] Cannot save: key is empty');
        return;
      }

      try {
        localStorage.setItem(storageKey, valToSave);
        lastSavedValueRef.current = valToSave;
        onSave?.(valToSave);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // 检查是否是配额超限错误
        if (
          err.name === 'QuotaExceededError' ||
          err.message.includes('quota')
        ) {
          console.warn(
            '[useComposerDraft] localStorage quota exceeded, draft not saved',
          );
        } else {
          console.error(
            '[useComposerDraft] Failed to save draft:',
            err.message,
          );
        }

        onSaveError?.(err);
      }
    },
    [storageKey, key, onSave, onSaveError],
  );

  // 立即保存草稿（跳过防抖）
  const saveDraft = useCallback((): void => {
    if (saveTimeoutRef.current !== undefined) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }

    if (value) {
      performSave(value);
    } else {
      clearDraft();
    }
  }, [value, performSave, clearDraft]);

  // 检查是否存在草稿
  const hasDraft = useCallback((): boolean => {
    if (!isBrowser || !key) {
      return false;
    }

    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey, key]);

  // 防抖保存草稿
  useEffect(() => {
    // 清除之前的定时器
    if (saveTimeoutRef.current !== undefined) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 如果值为空，直接清除草稿
    if (!value) {
      clearDraft();
      return;
    }

    // 如果值没有变化，跳过保存
    if (value === lastSavedValueRef.current) {
      return;
    }

    // 延迟保存（防抖）
    saveTimeoutRef.current = window.setTimeout(() => {
      performSave(value);
      saveTimeoutRef.current = undefined;
    }, debounceDelay);

    return () => {
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [value, debounceDelay, performSave, clearDraft]);

  // 组件卸载时的处理
  useEffect(() => {
    return () => {
      // 清理定时器
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 如果配置了卸载时清除，则清除草稿
      if (clearOnUnmount) {
        clearDraft();
      }
    };
  }, [clearOnUnmount, clearDraft]);

  return {
    loadDraft,
    clearDraft,
    saveDraft,
    hasDraft,
    initialValueLoaded: initialValueLoadedRef.current,
  };
}
