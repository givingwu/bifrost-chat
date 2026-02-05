import { z } from 'zod';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { StandardMessage } from '@/interfaces/message.interface';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import type { IMapper } from '../../interfaces/mapper.interface';
import {
  WabaAckSchema,
  WabaInboundSchema,
  WabaOutboundSchema,
} from './schemas';
import type { WabaAckDto, WabaInboundDto, WabaOutboundDto } from './types';

/**
 * WABA Mapper
 * - 负责在标准消息和 WABA DTO 之间进行转换
 * - 使用 Zod 进行 Schema 校验
 * - 纯函数设计，便于单元测试
 */
export class WabaMapper
  implements IMapper<WabaInboundDto, WabaOutboundDto, WabaAckDto>
{
  /**
   * 将标准消息转换为 WABA Outbound DTO
   */
  outboundToDto(message: StandardMessage): WabaOutboundDto {
    // 根据消息类型选择不同的 DTO 结构
    switch (message.type) {
      case MessageTypeEnum.Text:
        return this.textToOutboundDto(message);
      case MessageTypeEnum.Image:
        return this.mediaToOutboundDto(message, 'image');
      case MessageTypeEnum.Video:
        return this.mediaToOutboundDto(message, 'video');
      case MessageTypeEnum.Audio:
        return this.mediaToOutboundDto(message, 'audio');
      case MessageTypeEnum.File:
        return this.mediaToOutboundDto(message, 'document');
      case MessageTypeEnum.Template:
        return this.templateToOutboundDto(message);
      default:
        throw new Error(`Unsupported message type for WABA: ${message.type}`);
    }
  }

  /**
   * 将 WABA Inbound DTO 转换为标准消息
   */
  inboundToStandard(dto: WabaInboundDto): StandardMessage {
    // 校验 DTO
    const validated = this.validateInbound(dto);

    // 提取第一条消息（通常只有一个）
    const entry = validated.entry[0];
    const change = entry.changes[0];
    const wabaMessage = change.value.messages[0];
    const contact = change.value.contacts?.[0];

    // 转换消息类型
    const messageType = this.convertWabaMessageType(wabaMessage.type);

    // 构建标准消息
    return {
      id: wabaMessage.id,
      direction: MessageDirectionEnum.Incoming,
      channelType: ChannelTypeEnum.Waba,
      status: MessageStatusEnum.Sent,
      timestamp: Number.parseInt(wabaMessage.timestamp, 10) * 1000,
      type: messageType,
      content: this.convertWabaMessageContent(wabaMessage),
      sender: contact
        ? {
            id: contact.wa_id,
            channelType: ChannelTypeEnum.Waba,
          }
        : {
            id: wabaMessage.from,
            channelType: ChannelTypeEnum.Waba,
          },
      receiver: undefined,
      metadata: {
        from: wabaMessage.from,
        ptype: 'waba',
        phone_number_id: change.value.metadata.phone_number_id,
        display_phone_number: change.value.metadata.display_phone_number,
      },
    };
  }

  /**
   * 将 WABA ACK DTO 转换为消息状态
   */
  ackToStatus(ack: WabaAckDto): MessageStatusEnum {
    // 校验 ACK
    const validated = this.validateAck(ack);

    // 提取状态信息
    const entry = validated.entry[0];
    const change = entry.changes[0];
    const statusInfo = change.value.statuses[0];

    // 转换状态
    switch (statusInfo.status) {
      case 'sent':
        return MessageStatusEnum.Sent;
      case 'delivered':
        return MessageStatusEnum.Delivered;
      case 'read':
        return MessageStatusEnum.Read;
      case 'failed':
        return MessageStatusEnum.Failed;
      default:
        return MessageStatusEnum.Sent;
    }
  }

  /**
   * 校验 Inbound DTO
   */
  validateInbound(dto: unknown): WabaInboundDto {
    try {
      return WabaInboundSchema.parse(dto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `WABA Inbound DTO validation failed: ${error.issues.map((e) => e.message).join(', ')}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 校验 Outbound DTO
   */
  validateOutbound(dto: unknown): WabaOutboundDto {
    try {
      return WabaOutboundSchema.parse(dto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `WABA Outbound DTO validation failed: ${error.issues.map((e) => e.message).join(', ')}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 校验 ACK DTO
   */
  validateAck(dto: unknown): WabaAckDto {
    try {
      return WabaAckSchema.parse(dto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `WABA ACK DTO validation failed: ${error.issues.map((e) => e.message).join(', ')}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * 将文本消息转换为 Outbound DTO
   */
  private textToOutboundDto(message: StandardMessage): WabaOutboundDto {
    if (!('text' in message.content)) {
      throw new Error('Invalid content type for text message');
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.receiver?.id || '',
      type: 'text',
      text: {
        body: message.content.text,
        preview_url: false,
      },
    };
  }

  /**
   * 将模板消息转换为 Outbound DTO
   */
  private templateToOutboundDto(message: StandardMessage): WabaOutboundDto {
    if (!('templateId' in message.content)) {
      throw new Error('Invalid content type for template message');
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.receiver?.id || '',
      type: 'template',
      template: {
        name: String(message.content.templateId),
        language: {
          code: 'zh_CN', // 默认语言代码，可以从配置中读取
        },
        components: message.content.params
          ? [
              {
                type: 'body',
                parameters: Object.entries(message.content.params).map(
                  ([key, value]) => ({
                    type: 'text',
                    text: value,
                  }),
                ),
              },
            ]
          : undefined,
      },
    };
  }

  /**
   * 将媒体消息转换为 Outbound DTO
   */
  private mediaToOutboundDto(
    message: StandardMessage,
    mediaType: 'image' | 'video' | 'audio' | 'document',
  ): WabaOutboundDto {
    if (!('url' in message.content)) {
      throw new Error('Invalid content type for media message');
    }

    const baseDto = {
      messaging_product: 'whatsapp' as const,
      recipient_type: 'individual' as const,
      to: message.receiver?.id || '',
      type: mediaType,
    };

    switch (mediaType) {
      case 'image':
        return {
          ...baseDto,
          type: 'image',
          image: {
            link: message.content.url,
          },
        };
      case 'video':
        return {
          ...baseDto,
          type: 'video',
          video: {
            link: message.content.url,
          },
        };
      case 'audio':
        return {
          ...baseDto,
          type: 'audio',
          audio: {
            link: message.content.url,
          },
        };
      case 'document':
        return {
          ...baseDto,
          type: 'document',
          document: {
            link: message.content.url,
            filename: `file_${Date.now()}`,
          },
        };
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
  }

  /**
   * 转换 WABA 消息类型为标准消息类型
   */
  private convertWabaMessageType(wabaType: string): MessageTypeEnum {
    switch (wabaType) {
      case 'text':
        return MessageTypeEnum.Text;
      case 'image':
        return MessageTypeEnum.Image;
      case 'video':
        return MessageTypeEnum.Video;
      case 'audio':
        return MessageTypeEnum.Audio;
      case 'document':
        return MessageTypeEnum.File;
      case 'location':
        return MessageTypeEnum.Location;
      case 'template':
        return MessageTypeEnum.Template;
      default:
        return MessageTypeEnum.Other;
    }
  }

  /**
   * 转换 WABA 消息内容为标准消息内容
   */
  private convertWabaMessageContent(
    wabaMessage: any,
  ): StandardMessage['content'] {
    if (wabaMessage.text?.body) {
      return { text: wabaMessage.text.body };
    }

    if (wabaMessage.image?.id) {
      return {
        url: wabaMessage.image.id,
        mimeType: wabaMessage.image.mime_type,
      };
    }

    if (wabaMessage.video?.id) {
      return {
        url: wabaMessage.video.id,
        mimeType: wabaMessage.video.mime_type,
      };
    }

    if (wabaMessage.audio?.id) {
      return {
        url: wabaMessage.audio.id,
        mimeType: wabaMessage.audio.mime_type,
      };
    }

    if (wabaMessage.document?.id) {
      return {
        url: wabaMessage.document.id,
        mimeType: wabaMessage.document.mime_type,
      };
    }

    if (wabaMessage.location) {
      return {
        text: `Location: ${wabaMessage.location.latitude}, ${wabaMessage.location.longitude}`,
      };
    }

    return { text: '[Unsupported message type]' };
  }
}
