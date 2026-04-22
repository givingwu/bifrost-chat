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
  [ChannelTypeEnum.WaAgent]: '#16A34A', // green-600（自研 WhatsApp 代理，稍深以区分）
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
    viewBox="0 0 1024 1024"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path
      d="M700.8 592.7c-28.5-16-61.6-31.3-82.4-37.7-20.8-6.4-47.7 44.5-47.7 44.5s-25.2 6.1-80.6-38c-55.4-44.1-61-83.6-61-83.6s28.5-25.1 28.5-42.6-11.5-53.2-33.1-84.4c-21.6-31.2-114.7 0-87.8 111.7 10.2 42.3 33.1 87.4 112.4 155.8s154 77.5 200.1 69.2c46.2-8.3 80.1-78.9 51.6-94.9z"
      fill="currentColor"
    ></path>
    <path
      d="M516.5 112.3c-218.5 0-395.6 174.9-395.6 390.6 0 77.3 22.8 149.4 62 210.1 5 7.7-76.6 194.1-70.6 198.7 3.5 2.7 204.5-71.5 208-69.5 57.8 32.7 124.8 51.4 196.2 51.4 218.5 0 395.6-174.9 395.6-390.6 0-215.8-177.1-390.7-395.6-390.7z m0 703.1c-63 0-121.8-18.2-171.1-49.6-7-4.5-124.6 45.4-126.9 43.6-2.8-2.1 44.2-119.8 41.6-123.4-37.8-51.5-60-114.8-60-183.2 0-172.6 141.7-312.5 316.5-312.5s316.5 139.9 316.5 312.5c-0.2 172.7-141.8 312.6-316.6 312.6z"
      fill="currentColor"
    ></path>
  </svg>
);

/** WaAgent：自研 WhatsApp 代理（与 WhatsApp 相同图标，但颜色更深以区分） */
const WaAgentIcon: IconFactory = (size) => (
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
    <path
      d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
    <path
      d="M9.4 9c0-.55.45-1 1-1h.4c.45 0 .86.28 1.03.7l.44 1.05c.17.42.07.9-.27 1.22l-.28.27a4.5 4.5 0 0 0 2 1.99l.27-.28c.33-.34.81-.44 1.23-.26l1.05.43c.42.18.69.58.69 1.04v.4c0 .55-.45 1-1 1a6.57 6.57 0 0 1-6.56-6.56"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M17 6v4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
    />
    <path
      d="M15 8h4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
    />
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
  [ChannelTypeEnum.WaAgent]: WaAgentIcon,
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
