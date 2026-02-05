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
}

/**
 * 可用渠道类型数组
 */
export const AvailableChannelTypes: ChannelTypeEnum[] = [
  ChannelTypeEnum.SMS,
  ChannelTypeEnum.WhatsApp,
  ChannelTypeEnum.Email,
  ChannelTypeEnum.Waba,
];
