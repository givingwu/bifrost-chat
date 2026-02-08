import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useComposerConfig } from '@/store';
import type {
  ComposerToolbarProps,
  ComposerToolbarRef,
} from './ComposerToolbar';
import { ComposerToolbar } from './ComposerToolbar';

const DRAFT_KEY_PREFIX = 'bifrost-chat-draft-';

function canUseLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export interface ComposerWithDraftProps extends ComposerToolbarProps {
  /** 会话 ID（用于草稿存储） */
  conversationId?: string;
}

/**
 * ComposerWithDraft：带草稿功能的输入工具栏组件
 *
 * @description
 * 包装 ComposerToolbar 组件，提供草稿自动保存和加载功能。
 * 草稿功能包括：
 * - 自动保存输入内容到 localStorage（防抖 500ms）
 * - 组件挂载时自动加载草稿
 * - 发送成功后自动清除草稿
 * - 组件卸载时不清空草稿（下次打开同一会话时自动加载）
 *
 * @example
 * ```tsx
 * function ChatPanel({ conversationId, channel }) {
 *   return (
 *     <ServiceProvider {...services}>
 *       <ComposerWithDraft
 *         conversationId={conversationId}
 *         channel={channel}
 *         onSend={handleSend}
 *       />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export const ComposerWithDraft = forwardRef<
  ComposerToolbarRef,
  ComposerWithDraftProps
>(function ComposerWithDraft(
  { conversationId, onSend, templateLocked, ...restProps },
  ref,
) {
  const { enableDraft, draftDebounceDelay, clearDraftOnSend } =
    useComposerConfig();
  const childRef = useRef<ComposerToolbarRef>(null);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const loadedDraftKeyRef = useRef<string | null>(null);

  // 本地状态管理
  const [value, setValue] = useState('');

  // 草稿功能
  const draftEnabled = enableDraft ?? true;
  const draftStorageKey = conversationId
    ? `${DRAFT_KEY_PREFIX}conversation-${conversationId}`
    : null;

  const clearDraft = useCallback(() => {
    if (!draftStorageKey || !canUseLocalStorage()) {
      return;
    }

    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // 忽略 localStorage 异常，避免影响输入
    }
  }, [draftStorageKey]);

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
        // 忽略 localStorage 异常，避免影响输入
      }
    },
    [draftStorageKey],
  );

  // 初始化时加载草稿
  useEffect(() => {
    loadedDraftKeyRef.current = null;

    if (!draftEnabled || !draftStorageKey) {
      return;
    }

    // 如果模板被锁定（不允许编辑），则不加载草稿，避免覆盖模板内容
    if (templateLocked) {
      console.log('[ComposerWithDraft] Template locked, skipping draft load');
      return;
    }

    const draft = loadDraft();

    if (draft) {
      setValue(draft);
    }

    loadedDraftKeyRef.current = draftStorageKey;
  }, [draftEnabled, draftStorageKey, loadDraft, templateLocked]);

  // 防抖保存草稿，避免高频写 localStorage
  useEffect(() => {
    if (!draftEnabled || !draftStorageKey) {
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
    }, draftDebounceDelay ?? 500);

    return () => {
      if (saveTimeoutRef.current !== undefined) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftEnabled, draftStorageKey, value, saveDraft, draftDebounceDelay]);

  // 处理发送消息
  const handleSend = useCallback(
    async (content: string) => {
      await onSend?.(content);
      // 发送成功后清空输入框
      setValue('');
      // 清除草稿（如果配置了）
      if (clearDraftOnSend) {
        clearDraft();
      }
    },
    [onSend, clearDraft, clearDraftOnSend],
  );

  // 暴露 ref 方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      setValue: (newValue: string) => {
        // 调用子组件的 setValue，以触发 ComposerToolbar 中的锁定逻辑
        childRef.current?.setValue(newValue);
        setValue(newValue);
      },
      focus: () => {
        childRef.current?.focus();
      },
      getValue: () => value,
      setTemplateLocked: (locked: boolean) => {
        childRef.current?.setTemplateLocked(locked);
      },
    }),
    [value],
  );

  return (
    <ComposerToolbar
      ref={childRef}
      conversationId={conversationId}
      onSend={handleSend}
      value={value}
      onChange={setValue}
      templateLocked={templateLocked}
      {...restProps}
    />
  );
});

ComposerWithDraft.displayName = 'ComposerWithDraft';
