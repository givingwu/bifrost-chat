import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { ImageMessage } from '@/components/messages/ImageMessage';
import '@/styles/theme.css';

/**
 * ImageMessage 组件 Story 文档
 *
 * 展示图片消息的各种用法：
 * - 不同尺寸的图片
 * - 不同格式
 * - 加载状态
 */

const meta: Meta<typeof ImageMessage> = {
  title: 'Messages/ImageMessage',
  component: ImageMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageMessage>;

/**
 * 基础示例 - 默认图片
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ImageMessage
        content={{
          url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
          mimeType: 'image/jpeg',
        }}
      />
    </div>
  );
};

/**
 * 不同尺寸 - 展示不同大小的图片
 */
export const DifferentSizes = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">小图片</p>
        <ImageMessage
          content={{
            url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=200',
            mimeType: 'image/jpeg',
          }}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">中图片</p>
        <ImageMessage
          content={{
            url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
            mimeType: 'image/jpeg',
          }}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">大图片</p>
        <ImageMessage
          content={{
            url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=600',
            mimeType: 'image/jpeg',
          }}
        />
      </div>
    </div>
  );
};

/**
 * 不同格式 - 展示不同图片格式
 */
export const DifferentFormats = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">JPEG</p>
        <ImageMessage
          content={{
            url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
            mimeType: 'image/jpeg',
          }}
        />
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-xs text-text-muted mb-2">PNG</p>
        <ImageMessage
          content={{
            url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
            mimeType: 'image/png',
          }}
        />
      </div>
    </div>
  );
};

/**
 * 在消息气泡中使用 - 展示实际应用场景
 */
export const InMessageBubble = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <ImageMessage
            content={{
              url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400',
              mimeType: 'image/jpeg',
            }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <ImageMessage
            content={{
              url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
              mimeType: 'image/jpeg',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 多张图片 - 展示图片列表
 */
export const MultipleImages = () => {
  const images = [
    'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=300',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300',
  ];

  return (
    <div className="space-y-3">
      {images.map((url) => (
        <div key={url} className="flex justify-start">
          <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
            <ImageMessage
              content={{
                url,
                mimeType: 'image/jpeg',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 无效 URL - 展示错误处理
 */
export const InvalidUrl = () => {
  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">缺少 URL 字段</p>
          <ImageMessage content={{ text: 'No URL field' } as never} />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">无效的 URL 格式</p>
          <ImageMessage
            content={{
              url: 'not-a-valid-url',
              mimeType: 'image/jpeg',
            }}
          />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
          <p className="text-xs text-text-muted mb-2">不支持的协议</p>
          <ImageMessage
            content={{
              url: 'ftp://example.com/image.jpg',
              mimeType: 'image/jpeg',
            }}
          />
        </div>
      </div>
    </div>
  );
};
