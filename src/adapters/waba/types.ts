/**
 * WABA (WhatsApp Business API) DTO 类型定义
 * - 参考：https://developers.facebook.com/docs/whatsapp/cloud-api/messages/send
 */

/**
 * WABA 消息类型
 */
export type WabaMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'template'
  | 'location'
  | 'contacts'
  | 'interactive';

/**
 * WABA Outbound 文本消息 DTO
 */
export interface WabaOutboundTextDto {
  /** 产品类型，固定为 whatsapp */
  messaging_product: 'whatsapp';
  /** 接收者类型，固定为 individual */
  recipient_type: 'individual';
  /** 接收者电话号码 */
  to: string;
  /** 消息类型 */
  type: 'text';
  /** 文本消息内容 */
  text: {
    /** 消息正文 */
    body: string;
    /** 是否预览 URL */
    preview_url?: boolean;
  };
}

/**
 * WABA Outbound 模板消息 DTO
 */
export interface WabaOutboundTemplateDto {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body' | 'header' | 'footer';
      parameters?: Array<{
        type:
          | 'text'
          | 'currency'
          | 'date_time'
          | 'image'
          | 'document'
          | 'video';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
        image?: {
          link: string;
        };
        document?: {
          link: string;
          filename: string;
        };
        video?: {
          link: string;
        };
      }>;
    }>;
  };
}

/**
 * WABA Outbound 媒体消息 DTO（图片/视频/音频/文档）
 */
export interface WabaOutboundMediaDto {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'image' | 'video' | 'audio' | 'document';
  /** 媒体内容 */
  image?: {
    /** 媒体 URL */
    link?: string;
    /** 媒体 ID（已上传的媒体） */
    id?: string;
    /** 标题/说明 */
    caption?: string;
  };
  video?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
  document?: {
    link?: string;
    id?: string;
    caption?: string;
    /** 文件名 */
    filename?: string;
  };
}

/**
 * WABA Outbound 联合类型
 */
export type WabaOutboundDto =
  | WabaOutboundTextDto
  | WabaOutboundMediaDto
  | WabaOutboundTemplateDto;

/**
 * WABA Inbound 联系人信息
 */
export interface WabaInboundContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

/**
 * WABA Inbound 消息内容
 */
export interface WabaInboundMessage {
  /** 发送者电话号码 */
  from: string;
  /** 消息 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 消息类型 */
  type: WabaMessageType;
  /** 文本内容 */
  text?: {
    body: string;
  };
  /** 图片内容 */
  image?: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  /** 视频内容 */
  video?: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  /** 音频内容 */
  audio?: {
    mime_type: string;
    sha256: string;
    id: string;
    voice?: boolean;
  };
  /** 文档内容 */
  document?: {
    caption?: string;
    filename: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  /** 位置内容 */
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

/**
 * WABA Inbound 元数据
 */
export interface WabaInboundMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

/**
 * WABA Inbound 值
 */
export interface WabaInboundValue {
  messaging_product: 'whatsapp';
  metadata: WabaInboundMetadata;
  contacts?: WabaInboundContact[];
  messages: WabaInboundMessage[];
}

/**
 * WABA Inbound 变更
 */
export interface WabaInboundChange {
  value: WabaInboundValue;
  field: 'messages';
}

/**
 * WABA Inbound 入口
 */
export interface WabaInboundEntry {
  id: string;
  changes: WabaInboundChange[];
}

/**
 * WABA Inbound DTO（接收消息）
 */
export interface WabaInboundDto {
  object: 'whatsapp_business_account';
  entry: WabaInboundEntry[];
}

/**
 * WABA ACK 状态
 */
export type WabaAckStatus = 'sent' | 'delivered' | 'read' | 'failed';

/**
 * WABA ACK 状态信息
 */
export interface WabaAckStatusInfo {
  /** 消息 ID */
  id: string;
  /** 状态 */
  status: WabaAckStatus;
  /** 时间戳 */
  timestamp: string;
  /** 接收者 ID */
  recipient_id: string;
  /** 错误信息（如果失败） */
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

/**
 * WABA ACK 值
 */
export interface WabaAckValue {
  messaging_product: 'whatsapp';
  metadata: WabaInboundMetadata;
  statuses: WabaAckStatusInfo[];
}

/**
 * WABA ACK 变更
 */
export interface WabaAckChange {
  value: WabaAckValue;
  field: 'message_status';
}

/**
 * WABA ACK 入口
 */
export interface WabaAckEntry {
  id: string;
  changes: WabaAckChange[];
}

/**
 * WABA ACK DTO（消息回执）
 */
export interface WabaAckDto {
  object: 'whatsapp_business_account';
  entry: WabaAckEntry[];
}

/**
 * WABA 媒体上传响应
 */
export interface WabaMediaUploadResponse {
  /** 媒体 ID */
  id: string;
  /** 文件大小（字节） */
  file_size: number;
  /** MIME 类型 */
  mime_type: string;
  /** SHA256 哈希 */
  sha256: string;
  /** 直接 URL */
  url?: string;
}
