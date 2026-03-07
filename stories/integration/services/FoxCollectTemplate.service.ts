import {
  type MessageSendResult,
  MessageStatusEnum,
} from '@/interfaces/message.interface';
import type { Template } from '@/interfaces/template.interface';
import type {
  ITemplateService,
  TemplatePreviewParams,
  TemplatePreviewResult,
} from '@/services/template.service';
import { toRecord } from '../utils/converter.util';
import type { FoxCollectConfig } from './FoxCollectConversation.service';

interface FoxCollectTemplateListParams {
  chatId: string;
  channelType: string;
}

interface FoxCollectTemplateSendParams {
  id?: string;
  chatId: string;
  channelType: string;
  clientType?: string;
  template: string;
}

/**
 * FoxCollect 模板服务
 */
export class FoxCollectTemplateService
  implements
    ITemplateService<
      FoxCollectTemplateListParams,
      FoxCollectTemplateSendParams,
      TemplatePreviewParams
    >
{
  constructor(private readonly config: FoxCollectConfig) {}

  async list(params: FoxCollectTemplateListParams): Promise<Template[]> {
    const response = await fetch(
      `${this.config.endpoint}/chat/v2/template/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          chatId: params.chatId,
          channelType: params.channelType,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    const result = toRecord(await response.json());
    if (result.code !== 0) {
      throw new Error(String(result.message ?? 'Failed to fetch templates'));
    }

    const data = Array.isArray(result.data) ? result.data : [];
    return data.map((raw): Template => {
      const item = toRecord(raw);
      return {
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        code: String(item.code ?? ''),
        content: String(item.content ?? ''),
        category: '电催',
        tags: ['催收'],
        language: String(item.language ?? 'zh-CN'),
        createdAt: Date.now() - 7 * 86_400_000,
        updatedAt: Date.now() - 86_400_000,
      };
    });
  }

  async send(params: FoxCollectTemplateSendParams): Promise<MessageSendResult> {
    const tempId = params.id ?? `temp_${Date.now()}`;

    const response = await fetch(
      `${this.config.endpoint}/chat/v2/message/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({
          id: tempId,
          chatId: params.chatId,
          channelType: params.channelType,
          type: 'template',
          clientType: params.clientType ?? 'pc',
          template: params.template,
        }),
      },
    );

    if (!response.ok) {
      return {
        tempId,
        status: MessageStatusEnum.Failed,
        error: await response.text(),
      };
    }

    const result = toRecord(await response.json());
    return {
      tempId,
      messageId: String(toRecord(result.data).mid ?? ''),
      status:
        result.code === 0 ? MessageStatusEnum.Sent : MessageStatusEnum.Failed,
      error:
        result.code === 0
          ? undefined
          : String(result.message ?? 'Template message send failed'),
    };
  }

  async preview(params: TemplatePreviewParams): Promise<TemplatePreviewResult> {
    const templateCode = params.templateCode ?? '';
    // 模拟预览：返回一个带有预览内容的模板对象
    return {
      id: templateCode,
      code: templateCode,
      name: `模板 ${templateCode}`,
      content: `模板 ${templateCode} 的预览内容`,
      category: '电催',
      tags: ['催收'],
      language: 'zh-CN',
      createdAt: Date.now() - 86_400_000,
      updatedAt: Date.now(),
      params: {},
    };
  }
}
