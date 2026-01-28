/**
 * SDK 允许的渠道类型
 * - 对应 docs 中 AdapterFactory 的选择依据
 */
export enum ChannelType {
  /** SMS Channel */
  SMS = 'sms',
  /** WhatsApp Channel */
  WhatsApp = 'whatsapp',
  /** Email Channel */
  Email = 'email',
  /** VoIP Channel */
  VoIP = 'voip',
  /** Facebook Messenger Channel */
  FacebookMessenger = 'facebook_messenger',
}

/**
 * 可用渠道类型数组
 */
export const AvailableChannelTypes: ChannelType[] = [
  ChannelType.SMS,
  ChannelType.WhatsApp,
  ChannelType.Email,
  ChannelType.VoIP,
  ChannelType.FacebookMessenger,
];
