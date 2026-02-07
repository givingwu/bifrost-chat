import type { MessageTypeEnum } from './message.interface';

/**
 * 附件信息
 *
 * @description
 * 表示一个待发送的附件文件
 */
export interface AttachmentInfo {
  /** 文件对象 */
  file: File;
  /** 附件类型（图片、视频、文档等） */
  type: MessageTypeEnum.Image | MessageTypeEnum.Video | MessageTypeEnum.File;
  /** 预览 URL（对于图片/视频） */
  preview?: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;
}

/**
 * 发送附件的参数
 *
 * @description
 * SDK 传递给调用方的附件发送参数
 * 调用方负责文件上传和消息发送
 *
 * @example
 * ```typescript
 * const params: SendAttachmentParams = {
 *   conversationId: 'conv-123',
 *   attachments: [
 *     { file: File, type: MessageTypeEnum.Image, size: 1024000, mimeType: 'image/jpeg' }
 *   ],
 *   text: '查看附件',
 * };
 * ```
 */
export interface SendAttachmentParams {
  /** 会话 ID */
  conversationId: string;
  /** 附件列表 */
  attachments: AttachmentInfo[];
  /** 附加文本（可选） */
  text?: string;
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 发送附件的结果
 *
 * @description
 * 发送附件后的返回结果
 */
export interface SendAttachmentResult {
  /** 临时消息 ID */
  tempId: string;
  /** 真实消息 ID（服务端返回） */
  messageId?: string;
  /** 发送状态 */
  status: 'sent' | 'failed';
  /** 错误信息（如果失败） */
  error?: string;
  /** 上传的文件 URL（服务端返回） */
  fileUrls?: string[];
}
