import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useComposerDraft } from '@/hooks/use-composer-draft.hook';
import { useComposerConfig } from '@/store';
import type {
  ComposerToolbarProps,
  ComposerToolbarRef,
} from './ComposerToolbar';
import { ComposerToolbar } from './ComposerToolbar';

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
  const {
    enableDraft,
    draftDebounceDelay,
    clearDraftOnSend,
    keepDraftOnSwitch,
  } = useComposerConfig();
  const childRef = useRef<ComposerToolbarRef>(null);
  const { value, setValue, handleSend } = useComposerDraft({
    conversationId,
    templateLocked,
    enableDraft,
    draftDebounceDelay,
    clearDraftOnSend,
    keepDraftOnSwitch,
    onSend,
  });

  // 暴露 ref 方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      setValue: (newValue: string, templateId?: string) => {
        // 调用子组件的 setValue，以触发 ComposerToolbar 中的锁定逻辑
        childRef.current?.setValue(newValue, templateId);
        setValue(newValue);
      },
      focus: () => {
        childRef.current?.focus();
      },
      getValue: () => value,
      setTemplateLocked: (locked: boolean) => {
        childRef.current?.setTemplateLocked(locked);
      },
      setTemplateId: (templateId: string | undefined) => {
        childRef.current?.setTemplateId(templateId);
      },
    }),
    [value, setValue],
  );

  return (
    <ComposerToolbar
      ref={childRef}
      {...restProps}
      conversationId={conversationId}
      onSend={handleSend}
      value={value}
      onChange={setValue}
      templateLocked={templateLocked}
    />
  );
});

ComposerWithDraft.displayName = 'ComposerWithDraft';
