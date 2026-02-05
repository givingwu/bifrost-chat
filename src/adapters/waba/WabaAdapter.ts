import type {
  AdapterConfig,
  IChannelAdapter,
  IInteractionReporter,
  IMediaSender,
  IMessageReceiver,
  InteractionReportParams,
  ITemplateSender,
  ITextSender,
  MediaSendParams,
  SendResult,
  TemplateSendParams,
  TextSendParams,
} from '@/interfaces/adapter.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { StandardMessage } from '@/interfaces/message.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import { WabaMapper } from './WabaMapper';

/**
 * WABA 适配器
 * - 实现 WABA (WhatsApp Business API) 渠道的消息发送和接收
 * - 支持文本、图片、视频、音频、文档等消息类型
 * - 支持消息状态回执
 */
export class WabaAdapter
  implements
    IChannelAdapter,
    ITextSender,
    IMediaSender,
    IInteractionReporter,
    IMessageReceiver,
    ITemplateSender
{
  readonly channelType = ChannelTypeEnum.Waba;
  private mapper: WabaMapper;
  private config: AdapterConfig | undefined;
  private initialized = false;

  constructor() {
    this.mapper = new WabaMapper();
  }

  /**
   * 初始化适配器
   */
  async initialize(config: AdapterConfig): Promise<void> {
    this.config = config;
    this.initialized = true;

    if (config.debug) {
      console.info('[WabaAdapter] Initialized with config:', {
        endpoint: config.endpoint,
      });
    }
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    const wasDebug = this.config?.debug;
    this.config = undefined;
    this.initialized = false;

    if (wasDebug) {
      console.info('[WabaAdapter] Destroyed');
    }
  }

  /**
   * 检查适配器是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 发送文本消息
   */
  async sendText(params: TextSendParams): Promise<SendResult> {
    this.ensureInitialized();

    try {
      // 构建标准消息
      const message: StandardMessage = {
        id: '', // 服务端返回后填充
        tempId: this.generateTempId(),
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: MessageTypeEnum.Text,
        content: { text: params.content },
        receiver: { id: params.to, channelType: ChannelTypeEnum.Waba },
      };

      // 转换为 WABA DTO
      const dto = this.mapper.outboundToDto(message);
      const validated = this.mapper.validateOutbound(dto);

      // 发送到 NetLayer（这里需要注入 NetLayer 依赖）
      // TODO: 实现 NetLayer 集成
      if (this.config?.debug) {
        console.info('[WabaAdapter] Sending text message:', validated);
      }

      return {
        tempId: message.tempId ?? '',
        status: 'sending',
      };
    } catch (error) {
      if (this.config?.debug) {
        console.error('[WabaAdapter] Failed to send text message:', error);
      }

      return {
        tempId: this.generateTempId(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送媒体消息
   */
  async sendMedia(params: MediaSendParams): Promise<SendResult> {
    this.ensureInitialized();

    try {
      // 确定消息类型
      let messageType: MessageTypeEnum;
      switch (params.mediaType) {
        case 'image':
          messageType = MessageTypeEnum.Image;
          break;
        case 'video':
          messageType = MessageTypeEnum.Video;
          break;
        case 'audio':
          messageType = MessageTypeEnum.Audio;
          break;
        case 'document':
          messageType = MessageTypeEnum.File;
          break;
        default:
          throw new Error(`Unsupported media type: ${params.mediaType}`);
      }

      // 构建标准消息
      const message: StandardMessage = {
        id: '',
        tempId: this.generateTempId(),
        direction: 'outgoing' as any,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: messageType,
        content: {
          url: params.mediaUrl || params.mediaId || '',
          mimeType: this.getMimeType(params.mediaType),
        },
        receiver: { id: params.to, channelType: ChannelTypeEnum.Waba },
      };

      // 转换为 WABA DTO
      const dto = this.mapper.outboundToDto(message);
      const validated = this.mapper.validateOutbound(dto);

      // 发送到 NetLayer
      // TODO: 实现 NetLayer 集成
      if (this.config?.debug) {
        console.info('[WabaAdapter] Sending media message:', validated);
      }

      return {
        tempId: message.tempId!,
        status: 'sending',
      };
    } catch (error) {
      if (this.config?.debug) {
        console.error('[WabaAdapter] Failed to send media message:', error);
      }

      return {
        tempId: this.generateTempId(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(file: File): Promise<string> {
    this.ensureInitialized();

    // TODO: 实现 WABA 媒体上传 API
    // 参考：https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
    if (this.config?.debug) {
      console.info('[WabaAdapter] Uploading media file:', file.name);
    }

    // 临时返回文件名作为 ID
    return `media_${Date.now()}`;
  }

  /**
   * 上报用户交互（如已读回执）
   */
  async reportInteraction(params: InteractionReportParams): Promise<void> {
    this.ensureInitialized();

    // TODO: 实现 WABA 交互上报 API
    // 参考：https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    if (this.config?.debug) {
      console.info('[WabaAdapter] Reporting interaction:', params);
    }
  }

  /**
   * 发送模板消息
   */
  async sendTemplate(params: TemplateSendParams): Promise<SendResult> {
    this.ensureInitialized();

    try {
      // 构建标准消息
      const message: StandardMessage = {
        id: '',
        tempId: this.generateTempId(),
        direction: MessageDirectionEnum.Outgoing,
        channelType: ChannelTypeEnum.Waba,
        status: MessageStatusEnum.Sending,
        timestamp: Date.now(),
        type: MessageTypeEnum.Template,
        content: {
          text: '', // 模板消息也需要 text 字段
          templateId: params.templateId,
          params: params.params || {},
        },
        receiver: { id: params.to, channelType: ChannelTypeEnum.Waba },
      };

      // 转换为 WABA DTO
      const dto = this.mapper.outboundToDto(message);
      const validated = this.mapper.validateOutbound(dto);

      // 发送到 NetLayer
      // TODO: 实现 NetLayer 集成
      if (this.config?.debug) {
        console.info('[WabaAdapter] Sending template message:', validated);
      }

      return {
        tempId: message.tempId ?? '',
        status: 'sending',
      };
    } catch (error) {
      if (this.config?.debug) {
        console.error('[WabaAdapter] Failed to send template message:', error);
      }

      return {
        tempId: this.generateTempId(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 处理接收到的消息
   */
  async handleIncomingMessage(rawData: unknown): Promise<StandardMessage> {
    this.ensureInitialized();

    try {
      // 校验并转换消息
      const message = this.mapper.inboundToStandard(rawData as any);

      if (this.config?.debug) {
        console.info('[WabaAdapter] Received inbound message:', message);
      }

      return message;
    } catch (error) {
      if (this.config?.debug) {
        console.error('[WabaAdapter] Failed to handle inbound message:', error);
      }
      throw error;
    }
  }

  /**
   * 处理 ACK 回执
   */
  async handleAck(
    rawData: unknown,
  ): Promise<{ messageId: string; status: string }> {
    this.ensureInitialized();

    try {
      // 校验并转换 ACK
      const status = this.mapper.ackToStatus(rawData as any);

      // 提取消息 ID
      const ack = rawData as any;
      const messageId =
        ack.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id || '';

      if (this.config?.debug) {
        console.info('[WabaAdapter] Received ACK:', { messageId, status });
      }

      return { messageId, status };
    } catch (error) {
      if (this.config?.debug) {
        console.error('[WabaAdapter] Failed to handle ACK:', error);
      }
      throw error;
    }
  }

  /**
   * 确保适配器已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        '[WabaAdapter] Adapter not initialized. Call initialize() first.',
      );
    }
  }

  /**
   * 生成临时消息 ID
   */
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取媒体 MIME 类型
   */
  private getMimeType(mediaType: string): string {
    switch (mediaType) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'document':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}
