import { z } from 'zod';
import type {
  WabaAckDto,
  WabaInboundDto,
  WabaOutboundMediaDto,
  WabaOutboundTemplateDto,
  WabaOutboundTextDto,
} from './types';

/**
 * WABA Outbound 文本消息 Schema
 */
export const WabaOutboundTextSchema: z.ZodType<WabaOutboundTextDto> = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string().min(1, 'Recipient phone number is required'),
  type: z.literal('text'),
  text: z.object({
    body: z
      .string()
      .min(1, 'Message body is required')
      .max(4096, 'Message body must not exceed 4096 characters'),
    preview_url: z.boolean().optional(),
  }),
});

/**
 * WABA Outbound 模板消息 Schema
 */
export const WabaOutboundTemplateSchema: z.ZodType<WabaOutboundTemplateDto> =
  z.object({
    messaging_product: z.literal('whatsapp'),
    recipient_type: z.literal('individual'),
    to: z.string().min(1, 'Recipient phone number is required'),
    type: z.literal('template'),
    template: z.object({
      name: z.string().min(1, 'Template name is required'),
      language: z.object({
        code: z.string().min(1, 'Language code is required'),
      }),
      components: z
        .array(
          z.object({
            type: z.enum(['body', 'header', 'footer']),
            parameters: z
              .array(
                z.object({
                  type: z.enum([
                    'text',
                    'currency',
                    'date_time',
                    'image',
                    'document',
                    'video',
                  ]),
                  text: z.string().optional(),
                  currency: z
                    .object({
                      fallback_value: z.string(),
                      code: z.string(),
                      amount_1000: z.number(),
                    })
                    .optional(),
                  date_time: z
                    .object({
                      fallback_value: z.string(),
                    })
                    .optional(),
                  image: z
                    .object({
                      link: z.string().url(),
                    })
                    .optional(),
                  document: z
                    .object({
                      link: z.string().url(),
                      filename: z.string(),
                    })
                    .optional(),
                  video: z
                    .object({
                      link: z.string().url(),
                    })
                    .optional(),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
    }),
  });

/**
 * WABA Outbound 媒体消息 Schema（图片）
 */
const WabaOutboundImageSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string().min(1),
  type: z.literal('image'),
  image: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
    caption: z.string().max(2000).optional(),
  }),
});

/**
 * WABA Outbound 媒体消息 Schema（视频）
 */
const WabaOutboundVideoSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string().min(1),
  type: z.literal('video'),
  video: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
    caption: z.string().max(2000).optional(),
  }),
});

/**
 * WABA Outbound 媒体消息 Schema（音频）
 */
const WabaOutboundAudioSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string().min(1),
  type: z.literal('audio'),
  audio: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
  }),
});

/**
 * WABA Outbound 媒体消息 Schema（文档）
 */
const WabaOutboundDocumentSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  recipient_type: z.literal('individual'),
  to: z.string().min(1),
  type: z.literal('document'),
  document: z.object({
    link: z.string().url().optional(),
    id: z.string().optional(),
    caption: z.string().max(2000).optional(),
    filename: z.string().optional(),
  }),
});

/**
 * WABA Outbound 媒体消息联合 Schema
 */
export const WabaOutboundMediaSchema: z.ZodType<WabaOutboundMediaDto> = z.union(
  [
    WabaOutboundImageSchema,
    WabaOutboundVideoSchema,
    WabaOutboundAudioSchema,
    WabaOutboundDocumentSchema,
  ],
);

/**
 * WABA Outbound 消息联合 Schema
 */
export const WabaOutboundSchema = z.union([
  WabaOutboundTextSchema,
  WabaOutboundMediaSchema,
  WabaOutboundTemplateSchema,
]);

/**
 * WABA Inbound 消息 Schema
 */
const WabaInboundMessageSchema = z.object({
  from: z.string().min(1),
  id: z.string().min(1),
  timestamp: z.string(),
  type: z.enum([
    'text',
    'image',
    'video',
    'audio',
    'document',
    'template',
    'location',
    'contacts',
    'interactive',
  ]),
  text: z
    .object({
      body: z.string(),
    })
    .optional(),
  image: z
    .object({
      caption: z.string().optional(),
      mime_type: z.string(),
      sha256: z.string(),
      id: z.string(),
    })
    .optional(),
  video: z
    .object({
      caption: z.string().optional(),
      mime_type: z.string(),
      sha256: z.string(),
      id: z.string(),
    })
    .optional(),
  audio: z
    .object({
      mime_type: z.string(),
      sha256: z.string(),
      id: z.string(),
      voice: z.boolean().optional(),
    })
    .optional(),
  document: z
    .object({
      caption: z.string().optional(),
      filename: z.string(),
      mime_type: z.string(),
      sha256: z.string(),
      id: z.string(),
    })
    .optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

/**
 * WABA Inbound 联系人 Schema
 */
const WabaInboundContactSchema = z.object({
  profile: z.object({
    name: z.string(),
  }),
  wa_id: z.string(),
});

/**
 * WABA Inbound 值 Schema
 */
const WabaInboundValueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string(),
  }),
  contacts: z.array(WabaInboundContactSchema).optional(),
  messages: z.array(WabaInboundMessageSchema),
});

/**
 * WABA Inbound 变更 Schema
 */
const WabaInboundChangeSchema = z.object({
  value: WabaInboundValueSchema,
  field: z.literal('messages'),
});

/**
 * WABA Inbound 入口 Schema
 */
const WabaInboundEntrySchema = z.object({
  id: z.string(),
  changes: z.array(WabaInboundChangeSchema),
});

/**
 * WABA Inbound DTO Schema
 */
export const WabaInboundSchema: z.ZodType<WabaInboundDto> = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(WabaInboundEntrySchema),
});

/**
 * WABA ACK 状态 Schema
 */
const WabaAckStatusInfoSchema = z.object({
  id: z.string(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  timestamp: z.string(),
  recipient_id: z.string(),
  errors: z
    .array(
      z.object({
        code: z.number(),
        title: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

/**
 * WABA ACK 值 Schema
 */
const WabaAckValueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string(),
  }),
  statuses: z.array(WabaAckStatusInfoSchema),
});

/**
 * WABA ACK 变更 Schema
 */
const WabaAckChangeSchema = z.object({
  value: WabaAckValueSchema,
  field: z.literal('message_status'),
});

/**
 * WABA ACK 入口 Schema
 */
const WabaAckEntrySchema = z.object({
  id: z.string(),
  changes: z.array(WabaAckChangeSchema),
});

/**
 * WABA ACK DTO Schema
 */
export const WabaAckSchema: z.ZodType<WabaAckDto> = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(WabaAckEntrySchema),
});

/**
 * WABA 媒体上传响应 Schema
 */
export const WabaMediaUploadResponseSchema = z.object({
  id: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  sha256: z.string(),
  url: z.string().url().optional(),
});
