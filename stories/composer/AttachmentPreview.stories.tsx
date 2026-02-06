import type { Meta, StoryObj } from '@storybook/react';
import { AttachmentPreview } from '@/components/composer/AttachmentPreview';
import '@/styles/theme.css';

/**
 * AttachmentPreview 组件 Story 文档
 *
 * 展示附件预览列表的各种用法：
 * - 图片附件预览
 * - 文件附件预览
 * - 删除附件
 */

const meta: Meta<typeof AttachmentPreview> = {
  title: 'Composer/AttachmentPreview',
  component: AttachmentPreview,
  tags: ['autodocs'],
  argTypes: {
    attachments: {
      control: false,
      description: '附件列表',
    },
    onRemove: {
      control: false,
      description: '删除附件回调函数',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用删除操作',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AttachmentPreview>;

// 创建模拟 File 对象的辅助函数
function createMockFile(name: string, type: string, size: number): File {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/**
 * 图片附件
 */
export const ImageAttachments = () => {
  const attachments = [
    {
      file: createMockFile('photo1.jpg', 'image/jpeg', 1024 * 500),
      type: 'image' as const,
      size: '500 KB',
      preview: 'https://picsum.photos/200/150',
    },
    {
      file: createMockFile('photo2.jpg', 'image/jpeg', 1024 * 800),
      type: 'image' as const,
      size: '800 KB',
      preview: 'https://picsum.photos/200/150?random=2',
    },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <AttachmentPreview
        attachments={attachments}
        onRemove={(index) => console.log('Remove attachment at index:', index)}
      />
    </div>
  );
};

/**
 * 文件附件
 */
export const FileAttachments = () => {
  const attachments = [
    {
      file: createMockFile('document.pdf', 'application/pdf', 1024 * 1024 * 2),
      type: 'document' as const,
      size: '2 MB',
    },
    {
      file: createMockFile('report.docx', 'application/docx', 1024 * 500),
      type: 'document' as const,
      size: '500 KB',
    },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <AttachmentPreview
        attachments={attachments}
        onRemove={(index) => console.log('Remove attachment at index:', index)}
      />
    </div>
  );
};

/**
 * 混合附件
 */
export const MixedAttachments = () => {
  const attachments = [
    {
      file: createMockFile('photo.jpg', 'image/jpeg', 1024 * 500),
      type: 'image' as const,
      size: '500 KB',
      preview: 'https://picsum.photos/200/150',
    },
    {
      file: createMockFile('document.pdf', 'application/pdf', 1024 * 1024),
      type: 'document' as const,
      size: '1 MB',
    },
    {
      file: createMockFile('video.mp4', 'video/mp4', 1024 * 1024 * 5),
      type: 'video' as const,
      size: '5 MB',
    },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <AttachmentPreview
        attachments={attachments}
        onRemove={(index) => console.log('Remove attachment at index:', index)}
      />
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  const attachments = [
    {
      file: createMockFile('photo.jpg', 'image/jpeg', 1024 * 500),
      type: 'image' as const,
      size: '500 KB',
      preview: 'https://picsum.photos/200/150',
    },
  ];

  return (
    <div className="p-4 bg-muted rounded-lg">
      <AttachmentPreview
        attachments={attachments}
        onRemove={(index) => console.log('Remove attachment at index:', index)}
        disabled
      />
    </div>
  );
};

/**
 * 空附件列表
 */
export const Empty = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <AttachmentPreview
        attachments={[]}
        onRemove={(index) => console.log('Remove attachment at index:', index)}
      />
    </div>
  );
};
