/**
 * SDK 允许的渠道类型
 * - 对应 docs 中 AdapterFactory 的选择依据
 */
export enum ChannelTypeEnum {
  /** SMS Channel */
  SMS = 'sms',
  /** WhatsApp Channel */
  WhatsApp = 'whatsapp',
  /** Email Channel */
  Email = 'email',
  /** WABA (WhatsApp Business API) 是 WhatsApp 的官方企业级 API  */
  Waba = 'waba',
  /** VoIP Channel */
  // VoIP = 'voip',
}

/**
 * 可用渠道类型数组（使用 as const 确保类型安全）
 */
export const AvailableChannelTypes = [
  ChannelTypeEnum.SMS,
  ChannelTypeEnum.WhatsApp,
  ChannelTypeEnum.Email,
  ChannelTypeEnum.Waba,
] as const;

/**
 * 渠道类型联合类型（用于类型推导）
 */
export type AvailableChannelType = (typeof AvailableChannelTypes)[number];

/**
 * 渠道配置接口
 */
export interface ChannelConfig {
  /** 渠道类型 */
  type: ChannelTypeEnum;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越大优先级越高） */
  priority?: number;
  /** 渠道特定配置 */
  config?: Record<string, unknown>;
}

/**
 * 渠道能力枚举
 */
export enum ChannelCapabilityEnum {
  /** 发送文本 */
  SendText = 'send_text',
  /** 发送媒体 */
  SendMedia = 'send_media',
  /** 发送模板 */
  SendTemplate = 'send_template',
  /** 接收消息 */
  ReceiveMessage = 'receive_message',
  /** 上报交互 */
  ReportInteraction = 'report_interaction',
  /** 上传媒体 */
  UploadMedia = 'upload_media',
  /** 语音通话 */
  VoiceCall = 'voice_call',
  /** 视频通话 */
  VideoCall = 'video_call',
}
