import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { FileMessage } from '@/components/messages/FileMessage';
import '@/styles/theme.css';

/**
 * FileMessage 组件 Story 文档
 *
 * 展示文件消息的各种用法：
 * - 不同文件类型
 * - 不同文件大小
 */

const meta: Meta<typeof FileMessage> = {
  title: 'Messages/FileMessage',
  component: FileMessage,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'object',
      description: '消息内容',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileMessage>;

/**
 * 基础示例 - 默认文件
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <FileMessage
        content={{
          url: 'https://example.com/document.pdf',
          mimeType: 'application/pdf',
          size: 1024 * 100,
        }}
      />
    </div>
  );
};

/**
 * 不同文件类型 - 展示各种文件格式
 */
export const DifferentTypes = () => {
  const files = [
    {
      name: '文档',
      url: 'https://example.com/document.pdf',
      mimeType: 'application/pdf',
      size: 1024 * 100,
    },
    {
      name: '图片',
      url: 'https://example.com/image.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 500,
    },
    {
      name: '压缩包',
      url: 'https://example.com/archive.zip',
      mimeType: 'application/zip',
      size: 1024 * 1024 * 5,
    },
  ];

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div key={index} className="flex justify-start">
          <div className="max-w-[70%] px-4 py-2 bg-card text-text rounded-2xl rounded-tl-sm">
            <p className="text-xs text-text-muted mb-2">{file.name}</p>
            <FileMessage
              content={{
                url: file.url,
                mimeType: file.mimeType,
                size: file.size,
              }}
            />
          </div>
        </div>
      ))}
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
          <FileMessage
            content={{
              url: 'https://example.com/document.pdf',
              mimeType: 'application/pdf',
              size: 1024 * 100,
            }}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[70%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm">
          <FileMessage
            content={{
              url: 'https://example.com/report.docx',
              mimeType: 'application/docx',
              size: 1024 * 50,
            }}
          />
        </div>
      </div>
    </div>
  );
};
