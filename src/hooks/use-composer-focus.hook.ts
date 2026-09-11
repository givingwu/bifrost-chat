import { useCallback, useEffect, useRef } from 'react';

/**
 * Composer 组件的 ref 类型
 */
export interface ComposerRef {
  /** 聚焦输入框 */
  focus: () => void;
  /** 设置输入框值 */
  setValue: (
    content: string,
    templateCode?: string,
    templateMetadata?: unknown,
  ) => void;
}

/**
 * 管理 Composer 焦点的 Hook
 *
 * 当会话切换时自动聚焦到 Composer 输入框。
 * 使用 setTimeout(0) 确保在布局和子组件提交完成后再聚焦。
 *
 * @param activeConversationId 当前激活的会话 ID
 * @param composerRef Composer 组件的 ref
 * @returns scheduleComposerFocus 手动触发聚焦的函数
 *
 * @example
 * ```tsx
 * const composerRef = useRef<ComposerRef>(null);
 * useComposerFocus(activeConversationId, composerRef);
 * ```
 */
export function useComposerFocus(
  activeConversationId: string | undefined,
  composerRef: React.RefObject<ComposerRef | null>,
) {
  const previousActiveConversationIdRef = useRef(activeConversationId);
  const composerFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearComposerFocusTimer = useCallback(() => {
    if (composerFocusTimerRef.current !== null) {
      clearTimeout(composerFocusTimerRef.current);
      composerFocusTimerRef.current = null;
    }
  }, []);

  const scheduleComposerFocus = useCallback(() => {
    clearComposerFocusTimer();
    composerFocusTimerRef.current = setTimeout(() => {
      composerRef.current?.focus();
      composerFocusTimerRef.current = null;
    }, 0);
  }, [clearComposerFocusTimer, composerRef]);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearComposerFocusTimer();
    };
  }, [clearComposerFocusTimer]);

  // 会话切换后聚焦 Composer
  useEffect(() => {
    const previousActiveConversationId =
      previousActiveConversationIdRef.current;

    previousActiveConversationIdRef.current = activeConversationId;

    if (
      !activeConversationId ||
      previousActiveConversationId === activeConversationId
    ) {
      return;
    }

    scheduleComposerFocus();
  }, [activeConversationId, scheduleComposerFocus]);

  return { scheduleComposerFocus };
}
