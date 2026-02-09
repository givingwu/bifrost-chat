import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';
const DEFAULT_DRAFT_DEBOUNCE_DELAY = 500;

function canUseLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export interface UseComposerDraftOptions {
  conversationId?: string;
  templateLocked?: boolean;
  enableDraft?: boolean;
  draftDebounceDelay?: number;
  clearDraftOnSend?: boolean;
  keepDraftOnSwitch?: boolean;
  onSend?: (content: string, templateId?: string) => void | Promise<void>;
}

export interface UseComposerDraftResult {
  value: string;
  setValue: (nextValue: string) => void;
  draftStorageKey: string | null;
  clearDraft: () => void;
  loadDraft: () => string;
  saveDraft: (nextValue: string) => void;
  handleSend: (content: string, templateId?: string) => Promise<void>;
}

/**
 * useComposerDraft：管理会话草稿输入值、持久化与发送后清理。
 */
export function useComposerDraft({
  conversationId,
  templateLocked = false,
  enableDraft = true,
  draftDebounceDelay = DEFAULT_DRAFT_DEBOUNCE_DELAY,
  clearDraftOnSend = true,
  keepDraftOnSwitch = true,
  onSend,
}: UseComposerDraftOptions): UseComposerDraftResult {
  const [value, setValue] = useState('');
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const loadedDraftKeyRef = useRef<string | null>(null);
  const previousDraftKeyRef = useRef<string | null>(null);

  const draftStorageKey = useMemo(
    () =>
      conversationId
        ? `${DRAFT_KEY_PREFIX}conversation-${conversationId}`
        : null,
    [conversationId],
  );

  const clearDraftByKey = useCallback((storageKey: string | null) => {
    if (!storageKey || !canUseLocalStorage()) {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // 忽略 localStorage 异常，避免影响输入流程
    }
  }, []);

  const clearDraft = useCallback(() => {
    clearDraftByKey(draftStorageKey);
  }, [clearDraftByKey, draftStorageKey]);

  const loadDraft = useCallback(() => {
    if (!draftStorageKey || !canUseLocalStorage()) {
      return '';
    }

    try {
      return window.localStorage.getItem(draftStorageKey) ?? '';
    } catch {
      return '';
    }
  }, [draftStorageKey]);

  const saveDraft = useCallback(
    (nextValue: string) => {
      if (!draftStorageKey || !canUseLocalStorage()) {
        return;
      }

      try {
        if (nextValue) {
          window.localStorage.setItem(draftStorageKey, nextValue);
          return;
        }
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        // 忽略 localStorage 异常，避免影响输入流程
      }
    },
    [draftStorageKey],
  );

  useEffect(() => {
    const previousKey = previousDraftKeyRef.current;

    if (
      enableDraft &&
      !keepDraftOnSwitch &&
      previousKey &&
      previousKey !== draftStorageKey
    ) {
      clearDraftByKey(previousKey);
    }

    previousDraftKeyRef.current = draftStorageKey;
  }, [clearDraftByKey, draftStorageKey, enableDraft, keepDraftOnSwitch]);

  useEffect(() => {
    loadedDraftKeyRef.current = null;

    if (!enableDraft || !draftStorageKey) {
      setValue('');
      return;
    }

    // 模板锁定时不覆盖当前输入，避免覆盖模板内容
    if (templateLocked) {
      return;
    }

    setValue(loadDraft());
    loadedDraftKeyRef.current = draftStorageKey;
  }, [draftStorageKey, enableDraft, loadDraft, templateLocked]);

  useEffect(() => {
    if (!enableDraft || !draftStorageKey) {
      return;
    }

    if (loadedDraftKeyRef.current !== draftStorageKey) {
      return;
    }

    if (saveTimeoutRef.current !== undefined) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveDraft(value);
      saveTimeoutRef.current = undefined;
    }, draftDebounceDelay);

    return () => {
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftDebounceDelay, draftStorageKey, enableDraft, saveDraft, value]);

  const handleSend = useCallback(
    async (content: string, templateId?: string) => {
      await onSend?.(content, templateId);
      setValue('');

      if (clearDraftOnSend) {
        clearDraft();
      }
    },
    [clearDraft, clearDraftOnSend, onSend],
  );

  return {
    value,
    setValue,
    draftStorageKey,
    clearDraft,
    loadDraft,
    saveDraft,
    handleSend,
  };
}
