import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAttachments,
  revokeAttachmentPreviews,
} from '@/components/composer/AttachmentPreview';
import { useComposerDraft } from '@/hooks/use-composer-draft.hook';
import { useTemplatePreview } from '@/hooks/use-template-preview.hook';
import type { Attachment } from '@/interfaces/attachment.interface';
import type { AudioData } from '@/interfaces/audio.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { IComposerConfig } from '@/interfaces/composer.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import { useComposerConfig } from '@/store';

// ==================== 类型定义 ====================

/**
 * 合并后的 Composer 配置
 */
export type ResolvedComposerConfig = IComposerConfig & {
  disabled?: boolean;
  loading?: boolean;
};

/**
 * useComposerLogic Hook 选项
 */
export interface UseComposerLogicOptions {
  conversationId?: string;
  channel?: ChannelTypeEnum;
  enableDraft?: boolean;
  onSend?: (
    content: string,
    options?: { templateMetadata?: unknown },
  ) => void | Promise<void>;
  onSendAttachment?: (
    attachments: Attachment[],
    text?: string,
  ) => void | Promise<void>;
  onSendAudio?: (audio: AudioData) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  maxLength?: number;
}

/**
 * useComposerLogic Hook 返回值
 */
export interface UseComposerLogicResult {
  // 状态
  value: string;
  attachments: Attachment[];
  isRecording: boolean;
  isSending: boolean;
  isTemplateLocked: boolean;
  isRestoring: boolean;
  sendError: string | null;

  // 草稿元数据
  messageType: MessageTypeEnum | undefined;
  templateCode: string | number | undefined;

  // 配置
  config: ResolvedComposerConfig;

  // 计算值
  effectiveMaxLength: number;
  placeholder: string;
  canSend: boolean;

  // 操作
  setValue: (value: string) => void;
  handleSend: () => Promise<void>;
  handleClear: () => void;
  handleAttachmentSelect: (files: File[]) => void;
  handleRemoveAttachment: (index: number) => void;
  handleAudioInput: () => void;
  handleSendAudio: (audio: AudioData) => Promise<void>;
  handleCancelRecording: () => void;

  // 模板操作（供外部调用）
  setTemplate: (data: {
    content: string;
    templateCode?: string | number;
    templateMetadata?: unknown;
  }) => void;

  // Ref 支持
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  focus: () => void;
}

// ==================== Hook 实现 ====================

/**
 * 渠道最大长度映射
 */
const MAX_LENGTH_MAP: Record<ChannelTypeEnum, number> = {
  [ChannelTypeEnum.SMS]: 160,
  [ChannelTypeEnum.Email]: Infinity,
  [ChannelTypeEnum.WhatsApp]: 4096,
  [ChannelTypeEnum.Waba]: 4096,
  [ChannelTypeEnum.Viber]: 4096,
  [ChannelTypeEnum.IVR]: 2000,
};

/**
 * useComposerLogic - Composer 核心逻辑 Hook
 *
 * 整合所有状态管理和业务逻辑，返回渲染所需的所有数据和操作
 */
export const useComposerLogic = (
  options: UseComposerLogicOptions,
): UseComposerLogicResult => {
  const {
    conversationId,
    channel,
    enableDraft = true,
    onSend: onSendProp,
    onSendAttachment,
    onSendAudio,
    disabled = false,
    loading = false,
    maxLength: maxLengthProp,
  } = options;

  // ==================== 配置合并 ====================
  const storeConfig = useComposerConfig();
  const config = useMemo<ResolvedComposerConfig>(
    () => ({
      ...storeConfig,
      // Props 覆盖 Store 配置
      ...(disabled !== undefined && { disabled }),
      ...(loading !== undefined && { loading }),
    }),
    [storeConfig, disabled, loading],
  );

  // ==================== 草稿状态 ====================
  const draft = useComposerDraft({
    conversationId,
    enableDraft,
    clearDraftOnSend: config.clearDraftOnSend,
    keepDraftOnSwitch: config.keepDraftOnSwitch,
    draftDebounceDelay: config.draftDebounceDelay,
    onSend: onSendProp,
  });

  // ==================== 模板预览 ====================
  const { mutateAsync: previewTemplate } = useTemplatePreview();
  const [isRestoring, setIsRestoring] = useState(false);
  const processedConversationIdRef = useRef<string | undefined>(undefined);

  // 恢复 template 类型的 draft 时，重新 preview 获取最新内容
  useEffect(() => {
    if (!conversationId || !channel) return;

    // 避免重复处理同一个会话
    if (processedConversationIdRef.current === conversationId) return;

    const draftData = draft.getDraftData();

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
          draft.setValue(newContent);

          // 更新 draft 数据
          const stringParams = previewed.params
            ? Object.fromEntries(
                Object.entries(previewed.params).map(([k, v]) => [
                  k,
                  String(v),
                ]),
              )
            : undefined;

          draft.setDraftData({
            content: newContent,
            templateParams: stringParams,
          });
        })
        .catch((error) => {
          console.warn('[Composer] Failed to preview template draft:', error);
          // fallback: 使用缓存的 content
          draft.setValue(draftData.content);
        })
        .finally(() => {
          setIsRestoring(false);
        });
    }
  }, [channel, conversationId, draft, previewTemplate]);

  // ==================== 附件状态 ====================
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // 清理附件预览 URL
  useEffect(() => {
    return () => revokeAttachmentPreviews(attachments);
  }, [attachments]);

  // ==================== 录音状态 ====================
  const [isRecording, setIsRecording] = useState(false);

  // ==================== 发送状态 ====================
  const [isSending, setIsSending] = useState(false);

  // ==================== 错误状态 ====================
  const [sendError, setSendError] = useState<string | null>(null);

  // ==================== 计算值 ====================
  const effectiveMaxLength = useMemo(() => {
    if (maxLengthProp) return maxLengthProp;
    if (channel) {
      return MAX_LENGTH_MAP[channel] || 2000;
    }
    return 2000;
  }, [channel, maxLengthProp]);

  const placeholder = useMemo(() => {
    if (channel) {
      const channelLabels: Record<ChannelTypeEnum, string> = {
        [ChannelTypeEnum.SMS]: 'SMS',
        [ChannelTypeEnum.Email]: 'Email',
        [ChannelTypeEnum.WhatsApp]: 'WhatsApp',
        [ChannelTypeEnum.Waba]: 'WhatsApp Business',
        [ChannelTypeEnum.Viber]: 'Viber',
        [ChannelTypeEnum.IVR]: 'Voice Call',
      };
      return `Input ${channelLabels[channel] || channel} message...`;
    }
    return 'Input message...';
  }, [channel]);

  const canSend = useMemo(() => {
    const hasContent = draft.value.trim().length > 0 || attachments.length > 0;
    return hasContent && !isSending;
  }, [draft.value, isSending, attachments]);

  // 模板锁定状态：根据配置和消息类型计算
  const isTemplateLocked = useMemo(() => {
    // 如果是模板消息且配置不允许编辑，则锁定
    if (draft.messageType === MessageTypeEnum.Template) {
      return config.templateMode === 'edit' && !config.allowTemplateEdit;
    }
    return false;
  }, [draft.messageType, config.templateMode, config.allowTemplateEdit]);

  // ==================== 操作方法 ====================
  const handleSend = useCallback(async () => {
    if (!canSend || disabled || isSending) return;

    const messageToSend = draft.value.trim();
    const hasAttachments = attachments.length > 0;

    if (!messageToSend && !hasAttachments) return;

    setIsSending(true);
    setSendError(null);

    try {
      if (hasAttachments && onSendAttachment) {
        await onSendAttachment(attachments, messageToSend || undefined);
        setAttachments([]);
      } else if (messageToSend) {
        const options =
          draft.messageType === MessageTypeEnum.Template
            ? {
                templateCode: draft.templateCode,
                templateMetadata: draft.templateMetadata,
              }
            : undefined;
        await draft.handleSend(messageToSend, options);
      }

      // 清空
      draft.setValue('');
      draft.setMessageType(undefined);
      draft.setTemplateCode(undefined);
      draft.setTemplateParams(undefined);
      draft.setTemplateMetadata(undefined);
    } catch (error) {
      console.error('[Composer] Failed to send:', error);
      setSendError(error instanceof Error ? error.message : '发送失败');
    } finally {
      setIsSending(false);
    }
  }, [canSend, disabled, isSending, draft, attachments, onSendAttachment]);

  const handleClear = useCallback(() => {
    draft.setValue('');
    draft.setMessageType(undefined);
    draft.setTemplateCode(undefined);
    draft.setTemplateParams(undefined);
    setSendError(null);
  }, [draft]);

  const handleAttachmentSelect = useCallback(
    async (files: File[]) => {
      if (disabled || !config.enableAttachments) return;

      // 验证附件数量
      if (attachments.length + files.length > (config.maxAttachments || 10)) {
        setSendError(`Only support ${config.maxAttachments} attachments`);
        return;
      }

      // 验证文件大小
      for (const file of files) {
        if (file.size > (config.maxAttachmentSize || 10 * 1024 * 1024)) {
          setSendError(`File ${file.name} exceeds size limit`);
          return;
        }
      }

      const newAttachments = await createAttachments(files);
      setAttachments((prev) => [...prev, ...newAttachments]);
    },
    [disabled, config, attachments.length],
  );

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      const removed = newAttachments.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newAttachments;
    });
  }, []);

  const handleAudioInput = useCallback(() => {
    setIsRecording(true);
  }, []);

  const handleSendAudio = useCallback(
    async (audio: AudioData) => {
      if (!onSendAudio) return;

      setIsSending(true);

      try {
        await onSendAudio(audio);
        setIsRecording(false);
      } catch (error) {
        console.error('[Composer] Failed to send audio:', error);
      } finally {
        setIsSending(false);
      }
    },
    [onSendAudio],
  );

  const handleCancelRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  // ==================== 模板操作 ====================
  /**
   * 设置模板内容（由外部布局组件如 DefaultChatLayout 调用）
   * 这是外部控制 Composer 内容的唯一合法入口
   */
  const setTemplate = useCallback(
    (data: {
      content: string;
      templateCode?: string | number;
      templateMetadata?: unknown;
    }) => {
      draft.setValue(data.content);
      draft.setMessageType(MessageTypeEnum.Template);
      draft.setTemplateCode(data.templateCode);
      draft.setTemplateMetadata(data.templateMetadata);
    },
    [draft],
  );

  // ==================== Ref 支持 ====================
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ==================== 错误自动清除 ====================
  useEffect(() => {
    if (sendError) {
      const timer = setTimeout(() => setSendError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendError]);

  // ==================== 返回值 ====================
  return {
    // 状态
    value: draft.value,
    attachments,
    isRecording,
    isSending,
    isTemplateLocked,
    isRestoring,
    sendError,

    // 草稿元数据
    messageType: draft.messageType,
    templateCode: draft.templateCode,

    // 配置
    config,

    // 计算值
    effectiveMaxLength,
    placeholder,
    canSend,

    // 操作
    setValue: draft.setValue,
    handleSend,
    handleClear,
    handleAttachmentSelect,
    handleRemoveAttachment,
    handleAudioInput,
    handleSendAudio,
    handleCancelRecording,

    // 模板操作（供外部调用）
    setTemplate,

    // Ref 支持
    inputRef,
    focus,
  };
};
