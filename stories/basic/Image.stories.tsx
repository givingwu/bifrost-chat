import { ImageIcon } from 'lucide-react';
import type { Meta } from 'storybook-react-rsbuild';
import { Image } from '@/components/Image';
import '@/styles/theme.css';

/**
 * Image 组件 Story 文档
 *
 * 展示图片组件的各种用法：
 * - 正常加载
 * - 懒加载
 * - 加载失败处理
 * - 自定义占位符
 * - 不同尺寸和样式
 */

const meta: Meta<typeof Image> = {
  title: 'Basic/Image',
  component: Image,
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '图片 URL',
    },
    alt: {
      control: 'text',
      description: '替代文本',
    },
    lazy: {
      control: 'boolean',
      description: '是否懒加载',
    },
    className: {
      control: 'text',
      description: '自定义类名',
    },
  },
};

export default meta;

/**
 * 基础示例 - 默认图片
 */
export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
    alt: '风景图片',
    className: 'w-64 h-48 object-cover rounded-lg',
  },
};

/**
 * 懒加载 - 图片懒加载示例
 */
export const LazyLoad: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
    alt: '懒加载图片',
    lazy: true,
    className: 'w-64 h-48 object-cover rounded-lg',
  },
};

/**
 * 加载失败 - 展示错误处理
 */
export const FailedImage = () => (
  <div className="space-y-4">
    <div className="w-64 h-48">
      <Image
        src="https://invalid-url.com/image.jpg"
        alt="加载失败"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  </div>
);

/**
 * 自定义占位符 - 使用自定义内容作为占位符
 */
export const CustomFallback = () => (
  <div className="space-y-4">
    <div className="w-64 h-48">
      <Image
        src="https://invalid-url.com/image.jpg"
        alt="自定义占位符"
        className="w-full h-full object-cover rounded-lg"
        fallback={
          <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg">
            <ImageIcon className="w-12 h-12 text-text-muted" />
          </div>
        }
      />
    </div>
  </div>
);

/**
 * 不同尺寸 - 展示不同尺寸的图片
 */
export const Sizes = () => (
  <div className="flex items-end gap-4">
    <div className="w-32 h-24">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=200"
        alt="小图片"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
    <div className="w-48 h-36">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300"
        alt="中图片"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
    <div className="w-64 h-48">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400"
        alt="大图片"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  </div>
);

/**
 * 图片网格 - 展示多张图片
 */
export const ImageGrid = () => {
  const images = [
    'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=200',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200',
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-80">
      {images.map((src, index) => (
        <div key={src} className="aspect-square">
          <Image
            src={src}
            alt={`图片 ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * 圆形图片 - 展示圆形头像样式
 */
export const CircularImage = () => (
  <div className="flex gap-4">
    <div className="w-16 h-16">
      <Image
        src="https://i.pravatar.cc/150?img=12"
        alt="圆形头像"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
    <div className="w-20 h-20">
      <Image
        src="https://i.pravatar.cc/150?img=12"
        alt="圆形头像"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
    <div className="w-24 h-24">
      <Image
        src="https://i.pravatar.cc/150?img=12"
        alt="圆形头像"
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  </div>
);

/**
 * 带边框的图片
 */
export const WithBorder = () => (
  <div className="flex gap-4">
    <div className="w-48 h-36">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400"
        alt="带边框图片"
        className="w-full h-full object-cover rounded-lg border-4 border-white shadow-lg"
      />
    </div>
    <div className="w-48 h-36">
      <Image
        src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400"
        alt="带阴影图片"
        className="w-full h-full object-cover rounded-lg shadow-xl"
      />
    </div>
  </div>
);

/**
 * 响应式图片 - 自适应容器
 */
export const Responsive = () => (
  <div className="w-full max-w-md">
    <Image
      src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800"
      alt="响应式图片"
      className="w-full h-auto object-cover rounded-lg"
    />
  </div>
);

/**
 * 图片画廊 - 横向滚动
 */
export const ImageGallery = () => {
  const images = [
    'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=300',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=300',
  ];

  return (
    <div className="flex gap-4 overflow-x-auto w-96 pb-2">
      {images.map((src, index) => (
        <div key={src} className="shrink-0 w-48 h-36">
          <Image
            src={src}
            alt={`图片 ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  );
};
