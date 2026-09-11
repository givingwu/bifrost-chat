import { useCallback, useRef, useState } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import type { Template } from '@/interfaces/template.interface';
import type {
  TemplatePreviewParams,
  TemplatePreviewResult,
} from '@/services/core/template.service';

export interface TemplateSendOptions {
  type: MessageTypeEnum.Template;
  templateCode?: string;
  templateMetadata?: TemplatePreviewResult;
  [key: string]: unknown;
}

export interface UseTemplateSelectOptions {
  activeConversationId: string | undefined;
  activeChannel: ChannelTypeEnum;
  previewTemplate: (
    params: TemplatePreviewParams,
  ) => Promise<TemplatePreviewResult>;
  templateMode: 'direct' | 'edit';
  onDirectSend: (
    content: string,
    options: TemplateSendOptions,
  ) => Promise<void>;
  onEditFill: (
    content: string,
    templateCode: string | undefined,
    metadata: TemplatePreviewResult | undefined,
  ) => void;
  onPreviewError: (template: Template, error: unknown) => void;
}

/**
 * 共享的模板选择处理 hook。
 *
 * @description
 * 封装模板预览 → 模式分发（直发 / 回填）的完整流程，
 * 由 DefaultChatLayout 和 MobileChatLayout 共同使用，确保两端行为一致。
 *
 * - 通过 `optionsRef` 持有最新回调引用，`handleTemplateSelect` 引用稳定不变。
 * - `direct` 模式始终携带 `{ type: Template, templateCode, templateMetadata }`。
 * - `edit` 模式通过 `onEditFill` 将内容、code、metadata 交给调用方。
 */
export function useTemplateSelect(options: UseTemplateSelectOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [renderingTemplateId, setRenderingTemplateId] = useState<
    string | undefined
  >();

  const handleTemplateSelect = useCallback(async (template: Template) => {
    const {
      activeConversationId,
      activeChannel,
      previewTemplate,
      templateMode,
      onDirectSend,
      onEditFill,
      onPreviewError,
    } = optionsRef.current;

    if (!activeConversationId) return;

    setRenderingTemplateId(template.id);

    try {
      let contentToUse = template.content;
      let templateMetadata: TemplatePreviewResult | undefined;

      if (template.code) {
        try {
          templateMetadata = await previewTemplate({
            conversationId: activeConversationId,
            currentChannel: activeChannel,
            templateCode: template.code,
          });
          contentToUse = templateMetadata.previewContent;
        } catch (error) {
          onPreviewError(template, error);
          return;
        }
      }

      const sendOptions: TemplateSendOptions = {
        type: MessageTypeEnum.Template,
        templateCode: template.code,
        templateMetadata,
      };

      if (templateMode === 'direct') {
        await onDirectSend(contentToUse, sendOptions);
      } else {
        onEditFill(contentToUse, template.code, templateMetadata);
      }
    } finally {
      setRenderingTemplateId(undefined);
    }
  }, []);

  return { renderingTemplateId, handleTemplateSelect };
}
