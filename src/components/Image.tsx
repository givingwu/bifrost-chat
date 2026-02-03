import { type ImgHTMLAttributes, memo, useState } from 'react';

export interface ImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'onLoad' | 'onError'
  > {
  /** 图片 URL */
  src?: string | null;
  /** 替代文本 */
  alt?: string;
  /** 自定义类名 */
  className?: string;
  /** 占位符内容（可选） */
  fallback?: React.ReactNode;
  /** 默认占位符 URL（可选） */
  fallbackSrc?: string;
  /** 是否懒加载 */
  lazy?: boolean;
  /** 加载中时的类名 */
  loadingClassName?: string;
  /** 加载失败时的类名 */
  errorClassName?: string;
  /** 加载成功回调 */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** 加载失败回调 */
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * 默认图片占位符（SVG Data URI）
 */
const DEFAULT_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239CA3AF"%3E%3Cpath d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';

/**
 * 默认占位符组件
 */
export const DefaultImageFallback = ({ alt }: { alt?: string }) => (
  <svg
    className="w-full h-full text-gray-400"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
    aria-label={alt || '图片加载失败'}
  >
    <title>{alt || '图片加载失败'}</title>
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
  </svg>
);

/**
 * Image：通用图片组件。
 * - 显示图片或占位符。
 * - 支持自定义样式和占位符。
 * - 使用 memo 优化性能，避免不必要的重新渲染。
 * - 支持图片加载失败处理，显示默认占位符或自定义占位符。
 * - 支持加载状态动画。
 * - 支持无障碍访问（ARIA 标签）。
 *
 * @example
 * ```tsx
 * // 基础使用
 * <Image src={url} alt="描述" className="w-full h-auto" />
 *
 * // 使用自定义占位符
 * <Image
 *   src={url}
 *   alt="描述"
 *   fallback={<div>加载失败</div>}
 * />
 *
 * // 禁用懒加载
 * <Image src={url} alt="描述" lazy={false} />
 *
 * // 自定义加载和失败样式
 * <Image
 *   src={url}
 *   alt="描述"
 *   loadingClassName="animate-pulse"
 *   errorClassName="opacity-50"
 * />
 * ```
 */
export const Image = memo(
  ({
    src,
    alt = 'image',
    className = '',
    fallback,
    fallbackSrc,
    lazy = true,
    loadingClassName = 'animate-pulse',
    errorClassName = '',
    onLoad: onExternalLoad,
    onError: onExternalError,
    ...restProps
  }: ImageProps) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 处理图片加载失败
    const handleImageError = (
      event: React.SyntheticEvent<HTMLImageElement>,
    ) => {
      console.warn(`[Image] Failed to load image: ${src}`);
      setImageError(true);
      setIsLoading(false);
      onExternalError?.(event);
    };

    // 处理图片加载成功
    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      onExternalLoad?.(event);
    };

    // 确定是否显示图片
    const shouldShowImage = src && !imageError;

    // 构建类名
    const imageClassName = `${className} ${
      isLoading ? loadingClassName : ''
    } ${imageError ? errorClassName : ''}`.trim();

    return (
      <>
        {shouldShowImage ? (
          <img
            src={src}
            alt={alt}
            className={imageClassName}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading={lazy ? 'lazy' : 'eager'}
            {...restProps}
          />
        ) : fallback ? (
          <div className={className}>{fallback}</div>
        ) : (
          <img
            src={fallbackSrc || DEFAULT_IMAGE_PLACEHOLDER}
            alt={alt}
            className={imageClassName}
          />
        )}
      </>
    );
  },
);

Image.displayName = 'Image';
