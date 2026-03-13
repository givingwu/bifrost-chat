import type React from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

export type ChannelIconSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_PX: Record<ChannelIconSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * 各渠道品牌主题色
 *
 * 用于 ChannelFilter active 态背景色、角标 ring 色等。
 */
export const CHANNEL_BRAND_COLOR: Record<ChannelTypeEnum, string> = {
  [ChannelTypeEnum.SMS]: '#3B82F6', // blue-500
  [ChannelTypeEnum.WhatsApp]: '#22C55E', // green-500（WhatsApp 官方绿）
  [ChannelTypeEnum.Email]: '#F97316', // orange-500
  [ChannelTypeEnum.Viber]: '#8B5CF6', // violet-500（Viber 官方紫）
};

type IconFactory = (size: number) => React.ReactElement;

/**
 * 统一 outline（描边）风格，strokeWidth=1.75，fill=none。
 * 参考 Heroicons Outline 规范。
 */

/** SMS：对话气泡 + 省略号 */
const SmsIcon: IconFactory = (size) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <circle cx="8.5" cy="12" r=".75" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r=".75" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="12" r=".75" fill="currentColor" stroke="none" />
  </svg>
);

/** WhatsApp：圆形气泡 + 电话话筒 */
const WhatsAppIcon: IconFactory = (size) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M9.5 9c0-.6.4-1 1-1h.5c.5 0 1 .3 1.2.8l.5 1c.2.5.1 1.1-.3 1.4l-.4.3c.3.6.8 1.1 1.4 1.4l.3-.4c.4-.4.9-.5 1.4-.3l1 .5c.5.2.8.7.8 1.2v.5a1 1 0 0 1-1 1 5.5 5.5 0 0 1-5.5-5.5" />
  </svg>
);

/** Email：信封 */
const EmailIcon: IconFactory = (size) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

/** Viber：圆角气泡 + 话筒弧线 */
const ViberIcon: IconFactory = (size) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M9 9.5a.5 5 45 0 1 5.5 5.5" />
    <path d="M9.5 9a.5 3.5 45 0 1 3.5 3.5" />
    <circle cx="9.8" cy="9.2" r=".6" fill="currentColor" stroke="none" />
  </svg>
);

const CHANNEL_ICON_MAP: Partial<Record<ChannelTypeEnum, IconFactory>> = {
  [ChannelTypeEnum.SMS]: SmsIcon,
  [ChannelTypeEnum.WhatsApp]: WhatsAppIcon,
  [ChannelTypeEnum.Email]: EmailIcon,
  [ChannelTypeEnum.Viber]: ViberIcon,
};

/**
 * useChannelIcon：返回渠道图标获取函数
 *
 * 所有图标统一使用 outline（描边）风格，strokeWidth=1.75。
 *
 * @param size 图标尺寸，默认 'sm'（14px）
 *
 * @example
 * const getIcon = useChannelIcon();
 * getIcon(ChannelTypeEnum.SMS);        // SMS outline icon 14px
 *
 * const getIcon = useChannelIcon('md');
 * getIcon(ChannelTypeEnum.WhatsApp);   // WhatsApp outline icon 16px
 */
export const useChannelIcon = (size: ChannelIconSize = 'sm') => {
  const px = SIZE_PX[size];

  return (channel: ChannelTypeEnum): React.ReactNode => {
    const factory = CHANNEL_ICON_MAP[channel];
    return factory ? factory(px) : null;
  };
};
