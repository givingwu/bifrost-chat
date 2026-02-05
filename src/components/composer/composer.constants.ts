/**
 * Composer 组件常量配置
 * 集中管理魔法数字、字符串和配置项
 */

/** 文本大小常量 */
export const TEXT_SIZES = {
  /** 提示文本大小 */
  HINT: 'text-[10px]',
  /** 输入框文本大小 */
  INPUT: 'text-sm',
} as const;

/** 最大输入长度配置 */
export const INPUT_LIMITS = {
  /** SMS 单条消息最大字符数 */
  SMS_MAX_LENGTH: 160,
  /** WhatsApp 最大消息长度 */
  WHATSAPP_MAX_LENGTH: 4096,
  /** WABA 最大消息长度（与 WhatsApp 相同） */
  WABA_MAX_LENGTH: 4096,
  /** 默认最大长度 */
  DEFAULT_MAX_LENGTH: 2000,
} as const;

/** 按钮尺寸常量 */
export const BUTTON_SIZES = {
  /** 图标按钮尺寸 - 小 */
  ICON_SMALL: 'h-4 w-4',
  /** 图标按钮尺寸 - 中 */
  ICON_MEDIUM: 'h-5 w-5',
  /** 圆形按钮内边距 */
  CIRCULAR_PADDING: 'p-3',
  /** 小按钮内边距 */
  SMALL_PADDING: 'p-2',
} as const;

/** ARIA 标签常量 */
export const ARIA_LABELS = {
  SEND: 'Send message',
  ATTACHMENT: 'Attach file',
  VOICE_INPUT: 'Voice input',
  EMOJI: 'Insert emoji',
  COMPOSER_INPUT: 'Message input',
} as const;

/** 渠道提示信息映射 */
export const CHANNEL_HINTS = {
  sms: 'SMS · 1 segment',
  whatsapp: 'Secure Connection',
  email: 'Rich text enabled',
  waba: 'WhatsApp Business API',
  default: '',
} as const;

/** 测试 ID 常量 */
export const TEST_IDS = {
  COMPOSER: 'composer',
  COMPOSER_INPUT: 'composer-input',
  COMPOSER_SEND: 'composer-send',
  COMPOSER_ATTACH: 'composer-attach',
  COMPOSER_VOICE: 'composer-voice',
  COMPOSER_EMOJI: 'composer-emoji',
  COMPOSER_HINT: 'composer-hint',
  COMPOSER_CHANNEL_BADGE: 'composer-channel-badge',
  COMPOSER_CHAR_COUNT: 'composer-char-count',
} as const;
