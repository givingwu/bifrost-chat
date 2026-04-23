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
  /** EMAIL 单条消息最大字符数 */
  EMAIL_MAX_LENGTH: Infinity,
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
  /** 图标按钮尺寸 - 超小（用于底部工具栏） */
  ICON_XS: 'h-3 w-3',
  /** 圆形按钮内边距 */
  CIRCULAR_PADDING: 'p-3',
  /** 小按钮内边距 */
  SMALL_PADDING: 'p-2',
  /** 超小按钮内边距（用于底部工具栏） */
  XS_PADDING: 'p-1.5',
} as const;

/** ARIA 标签 i18n key 映射（使用时需通过 t() 解析） */
export const ARIA_LABELS = {
  SEND: 'composer.aria.send',
  ATTACHMENT: 'composer.aria.attachment',
  VOICE_INPUT: 'composer.aria.voiceInput',
  EMOJI: 'composer.aria.emoji',
  COMPOSER_INPUT: 'composer.aria.input',
  CLEAR: 'composer.aria.clear',
} as const;

/** 渠道提示信息 i18n key 映射（使用时需通过 t() 解析） */
export const CHANNEL_HINTS: Record<string, string> = {
  sms: 'composer.hint.sms',
  whatsapp: 'composer.hint.whatsapp',
  wa_agent: 'composer.hint.wa_agent',
  email: 'composer.hint.email',
  viber: 'composer.hint.viber',
  default: 'composer.hint.default',
};

/** 测试 ID 常量 */
export const TEST_IDS = {
  COMPOSER: 'composer',
  COMPOSER_SKELETON: 'composer-skeleton',
  COMPOSER_INPUT: 'composer-input',
  COMPOSER_SEND: 'composer-send',
  COMPOSER_ATTACH: 'composer-attach',
  COMPOSER_VOICE: 'composer-voice',
  COMPOSER_EMOJI: 'composer-emoji',
  COMPOSER_HINT: 'composer-hint',
  COMPOSER_CHANNEL_SWITCHER: 'composer-channel-switcher',
  COMPOSER_CHAR_COUNT: 'composer-char-count',
  COMPOSER_CLEAR: 'composer-clear',
} as const;
