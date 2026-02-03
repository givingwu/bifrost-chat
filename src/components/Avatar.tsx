import { type KeyboardEvent, type MouseEvent, memo } from 'react';
import { Image } from './Image';

export interface AvatarProps {
  /** 图片 URL */
  src?: string | null;
  /** 替代文本 */
  alt?: string;
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义类名 */
  className?: string;
  /** 是否圆形 */
  rounded?: boolean;
  /** 点击回调 */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /** 键盘事件回调 */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** 占位符内容（可选） */
  fallback?: React.ReactNode;
  /** 是否懒加载 */
  lazy?: boolean;
}

/**
 * 头像尺寸配置
 */
const AVATAR_SIZE_MAP = {
  sm: 'w-6 h-6',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
} as const;

/**
 * 默认头像占位符（SVG Data URI）
 */
const DEFAULT_AVATAR_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

/**
 * 默认占位符组件
 */
const DefaultFallback = () => (
  <svg
    className="w-full h-full text-gray-400"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

/**
 * Avatar：通用头像组件。
 * - 显示图片或占位符。
 * - 基于通用 Image 组件构建。
 * - 支持自定义尺寸和样式。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持图片加载失败处理，显示默认头像或自定义占位符。
 * - 支持无障碍访问（ARIA 标签）。
 *
 * @example
 * ```tsx
 * <Avatar src={user.avatar} alt={user.name} size="md" />
 * <Avatar src={null} alt="No avatar" fallback={<div>No Image</div>} />
 * ```
 */
export const Avatar = memo(
  ({
    src,
    alt = '头像',
    size = 'md',
    className = '',
    rounded = true,
    onClick,
    onKeyDown,
    fallback,
    lazy = true,
  }: AvatarProps) => {
    // 容器类名
    const containerClassName =
      `relative inline-flex items-center justify-center overflow-hidden bg-gray-200 ${
        rounded ? 'rounded-full' : 'rounded-lg'
      } ${AVATAR_SIZE_MAP[size]} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`.trim();

    return (
      <div
        className={containerClassName}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="img"
        aria-label={alt}
        tabIndex={onClick ? 0 : undefined}
      >
        <Image
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          fallback={fallback || <DefaultFallback />}
          fallbackSrc={DEFAULT_AVATAR_URL}
          lazy={lazy}
        />
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
