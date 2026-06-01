import type { ReactElement, ReactNode, SVGProps } from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';

/**
 * 渠道图标尺寸枚举。
 *
 * @remarks
 * 预设尺寸用于 SDK 内部工具栏、角标等固定场景；第三方也可以传入
 * number 自定义像素尺寸。
 */
export type ChannelIconSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * 渠道图标组件公共属性。
 *
 * @remarks
 * 默认按装饰性图标处理（aria-hidden=true）。如需作为可访问图片暴露，
 * 请传入 `title`、`aria-label` 或设置 `decorative={false}`。
 */
export interface ChannelIconComponentProps extends SVGProps<SVGSVGElement> {
  /** 图标尺寸，支持预设值或像素数。 */
  size?: ChannelIconSize | number;
  /** 可访问标题；传入后图标会默认按 img 暴露给读屏器。 */
  title?: string;
  /** 是否为装饰性图标；未传时根据 title/aria-label 自动判断。 */
  decorative?: boolean;
}

/**
 * 通用渠道图标组件属性。
 */
export interface ChannelIconProps extends ChannelIconComponentProps {
  /** 需要渲染的渠道类型。 */
  channel: ChannelTypeEnum;
}

/**
 * 单个渠道图标组件类型。
 */
export type ChannelIconComponent = (
  props: ChannelIconComponentProps,
) => ReactElement | null;

/**
 * 渠道图标预设尺寸映射。
 */
export const CHANNEL_ICON_SIZE_PX: Record<ChannelIconSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * 各渠道品牌主题色。
 *
 * @remarks
 * 可用于第三方自定义按钮、角标背景或 hover/active 态，与 SDK
 * 内置 ChannelFilter/ChannelBadge 保持一致。
 */
export const CHANNEL_BRAND_COLOR: Record<ChannelTypeEnum, string> = {
  [ChannelTypeEnum.SMS]: '#3B82F6',
  [ChannelTypeEnum.WhatsApp]: '#22C55E',
  [ChannelTypeEnum.WaAgent]: '#16A34A',
  [ChannelTypeEnum.Email]: '#F97316',
  [ChannelTypeEnum.Viber]: '#8B5CF6',
  [ChannelTypeEnum.RCS]: '#06B6D4',
};

interface ChannelIconBaseProps extends ChannelIconComponentProps {
  children: ReactNode;
  viewBox?: string;
}

function resolveChannelIconSize(size: ChannelIconSize | number): number {
  return typeof size === 'number' ? size : CHANNEL_ICON_SIZE_PX[size];
}

function ChannelIconBase({
  size = 'sm',
  title,
  decorative,
  width,
  height,
  children,
  viewBox = '0 0 24 24',
  'aria-label': ariaLabel,
  ...svgProps
}: ChannelIconBaseProps) {
  const px = resolveChannelIconSize(size);
  const label = ariaLabel ?? title;
  const isDecorative = decorative ?? !label;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? px}
      height={height ?? px}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : label}
      role={isDecorative ? undefined : 'img'}
      {...svgProps}
    >
      {!isDecorative && title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/**
 * SMS 短信渠道图标。
 */
export const SmsChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <circle cx="8.5" cy="12" r=".75" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r=".75" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="12" r=".75" fill="currentColor" stroke="none" />
  </ChannelIconBase>
);

/**
 * WhatsApp 渠道图标。
 */
export const WhatsAppChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props} viewBox="0 0 1024 1024">
    <path
      d="M700.8 592.7c-28.5-16-61.6-31.3-82.4-37.7-20.8-6.4-47.7 44.5-47.7 44.5s-25.2 6.1-80.6-38c-55.4-44.1-61-83.6-61-83.6s28.5-25.1 28.5-42.6-11.5-53.2-33.1-84.4c-21.6-31.2-114.7 0-87.8 111.7 10.2 42.3 33.1 87.4 112.4 155.8s154 77.5 200.1 69.2c46.2-8.3 80.1-78.9 51.6-94.9z"
      fill="currentColor"
    />
    <path
      d="M516.5 112.3c-218.5 0-395.6 174.9-395.6 390.6 0 77.3 22.8 149.4 62 210.1 5 7.7-76.6 194.1-70.6 198.7 3.5 2.7 204.5-71.5 208-69.5 57.8 32.7 124.8 51.4 196.2 51.4 218.5 0 395.6-174.9 395.6-390.6 0-215.8-177.1-390.7-395.6-390.7z m0 703.1c-63 0-121.8-18.2-171.1-49.6-7-4.5-124.6 45.4-126.9 43.6-2.8-2.1 44.2-119.8 41.6-123.4-37.8-51.5-60-114.8-60-183.2 0-172.6 141.7-312.5 316.5-312.5s316.5 139.9 316.5 312.5c-0.2 172.7-141.8 312.6-316.6 312.6z"
      fill="currentColor"
    />
  </ChannelIconBase>
);

/**
 * WaAgent 自研 WhatsApp 代理渠道图标。
 */
export const WaAgentChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M9.4 9c0-.55.45-1 1-1h.4c.45 0 .86.28 1.03.7l.44 1.05c.17.42.07.9-.27 1.22l-.28.27a4.5 4.5 0 0 0 2 1.99l.27-.28c.33-.34.81-.44 1.23-.26l1.05.43c.42.18.69.58.69 1.04v.4c0 .55-.45 1-1 1a6.57 6.57 0 0 1-6.56-6.56" />
    <path d="M17 6v4" />
    <path d="M15 8h4" />
  </ChannelIconBase>
);

/**
 * Email 邮件渠道图标。
 */
export const EmailChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </ChannelIconBase>
);

/**
 * Viber 渠道图标。
 */
export const ViberChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    <path d="M9 9.5a.5 5 45 0 1 5.5 5.5" />
    <path d="M9.5 9a.5 3.5 45 0 1 3.5 3.5" />
    <circle cx="9.8" cy="9.2" r=".6" fill="currentColor" stroke="none" />
  </ChannelIconBase>
);

/**
 * RCS 富通信服务渠道图标。
 */
export const RcsChannelIcon = (props: ChannelIconComponentProps) => (
  <ChannelIconBase {...props}>
    <path d="M7 18.5A7.5 7.5 0 1 1 9.8 20L5 22Z" />
    <path d="M8 10.5h8" />
    <path d="M8 14h5" />
    <circle cx="16" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </ChannelIconBase>
);

/**
 * 渠道类型到公开图标组件的稳定映射。
 */
export const CHANNEL_ICON_COMPONENTS: Record<
  ChannelTypeEnum,
  ChannelIconComponent
> = {
  [ChannelTypeEnum.SMS]: SmsChannelIcon,
  [ChannelTypeEnum.WhatsApp]: WhatsAppChannelIcon,
  [ChannelTypeEnum.WaAgent]: WaAgentChannelIcon,
  [ChannelTypeEnum.Email]: EmailChannelIcon,
  [ChannelTypeEnum.Viber]: ViberChannelIcon,
  [ChannelTypeEnum.RCS]: RcsChannelIcon,
};

/**
 * ChannelIcon：按渠道类型渲染对应渠道图标。
 *
 * @example
 * ```tsx
 * <ChannelIcon channel={ChannelTypeEnum.WhatsApp} size="md" />
 * <ChannelIcon channel={ChannelTypeEnum.RCS} size={18} title="RCS" />
 * ```
 */
export const ChannelIcon = ({ channel, ...props }: ChannelIconProps) => {
  const Icon = CHANNEL_ICON_COMPONENTS[channel];

  return Icon ? <Icon {...props} /> : null;
};
