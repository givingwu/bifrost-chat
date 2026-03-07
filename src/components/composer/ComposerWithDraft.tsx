import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useComposerDraft } from '@/hooks/use-composer-draft.hook';
import { useTemplatePreview } from '@/hooks/use-template-preview.hook';
import { MessageTypeEnum } from '@/interfaces/message.interface';
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
 * - 模板类型草稿恢复时重新 preview 获取最新内容
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
  { conversationId, onSend, templateLocked, channel, ...restProps },
  ref,
) {
  const {
    enableDraft,
    draftDebounceDelay,
    clearDraftOnSend,
    keepDraftOnSwitch,
  } = useComposerConfig();
  const childRef = useRef<ComposerToolbarRef>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { mutateAsync: previewTemplate } = useTemplatePreview();

  const {
    value,
    setValue,
    messageType,
    loadDraftData,
    setDraftData,
    handleSend,
  } = useComposerDraft({
    conversationId,
    templateLocked,
    enableDraft,
    draftDebounceDelay,
    clearDraftOnSend,
    keepDraftOnSwitch,
    onSend,
  });

  // 用于跟踪是否已处理过当前会话的 draft 恢复
  const processedConversationIdRef = useRef<string | undefined>(undefined);

  // 恢复 template 类型的 draft 时，重新 preview 获取最新内容
  useEffect(() => {
    // 仅在 conversationId 变化时执行
    if (!conversationId || !channel) {
      return;
    }

    // 避免重复处理同一个会话
    if (processedConversationIdRef.current === conversationId) {
      return;
    }

    const draftData = loadDraftData();

    // 如果是 template 类型的 draft，重新 preview
    if (
      draftData.messageType === MessageTypeEnum.Template &&
      draftData.templateCode &&
      draftData.content
    ) {
      setIsRestoring(true);
      processedConversationIdRef.current = conversationId;

      previewTemplate({
        conversationId,
        currentChannel: channel,
        templateCode: String(draftData.templateCode),
      })
        .then((previewed) => {
          // 使用最新的 content
          const newContent = previewed.content ?? draftData.content;
          setValue(newContent);

          // 更新 draft 数据（转换 params 类型）
          const stringParams = previewed.params
            ? Object.fromEntries(
                Object.entries(previewed.params).map(([k, v]) => [
                  k,
                  String(v),
                ]),
              )
            : undefined;

          setDraftData({
            content: newContent,
            templateParams: stringParams,
          });

          console.log(
            '[ComposerWithDraft] Template draft restored with latest content',
          );
        })
        .catch((error: unknown) => {
          console.warn(
            '[ComposerWithDraft] Failed to preview template draft, using cached content:',
            error,
          );
          // fallback: 使用缓存的 content
          setValue(draftData.content);
        })
        .finally(() => {
          setIsRestoring(false);
        });
    }
  }, [
    channel,
    conversationId,
    loadDraftData,
    previewTemplate,
    setDraftData,
    setValue,
  ]);

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
      channel={channel}
      onSend={handleSend}
      value={value}
      onChange={setValue}
      templateLocked={
        templateLocked || messageType === MessageTypeEnum.Template
      }
      disabled={isRestoring}
      loading={isRestoring}
    />
  );
});

ComposerWithDraft.displayName = 'ComposerWithDraft';
