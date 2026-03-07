import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { AttachmentPreview } from '@/components/composer/AttachmentPreview';
import { MessageTypeEnum } from '@/index';
import type { Attachment } from '@/interfaces/attachment.interface';
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
  const attachments: Attachment[] = [
    {
      file: createMockFile('photo1.jpg', 'image/jpeg', 1024 * 500),
      type: MessageTypeEnum.Image,
      size: 1024 * 500,
      name: 'photo1.jpg',
      mimeType: 'image/jpeg',
      preview: 'https://picsum.photos/200/150',
    },
    {
      file: createMockFile('photo2.jpg', 'image/jpeg', 1024 * 800),
      type: MessageTypeEnum.Image,
      size: 1024 * 800,
      name: 'photo2.jpg',
      mimeType: 'image/jpeg',
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
  const attachments: Attachment[] = [
    {
      file: createMockFile('document.pdf', 'application/pdf', 1024 * 1024 * 2),
      type: MessageTypeEnum.File,
      size: 1024 * 1024 * 2,
      name: 'document.pdf',
      mimeType: 'application/pdf',
    },
    {
      file: createMockFile('report.docx', 'application/docx', 1024 * 500),
      type: MessageTypeEnum.File,
      size: 1024 * 500,
      name: 'report.docx',
      mimeType: 'application/docx',
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
  const attachments: Attachment[] = [
    {
      file: createMockFile('photo.jpg', 'image/jpeg', 1024 * 500),
      type: MessageTypeEnum.Image,
      size: 1024 * 500,
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      preview: 'https://picsum.photos/200/150',
    },
    {
      file: createMockFile('document.pdf', 'application/pdf', 1024 * 1024),
      type: MessageTypeEnum.File,
      size: 1024 * 1024,
      name: 'document.pdf',
      mimeType: 'application/pdf',
    },
    {
      file: createMockFile('video.mp4', 'video/mp4', 1024 * 1024 * 5),
      type: MessageTypeEnum.Video,
      size: 1024 * 1024 * 5,
      name: 'video.mp4',
      mimeType: 'video/mp4',
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
  const attachments: Attachment[] = [
    {
      file: createMockFile('photo.jpg', 'image/jpeg', 1024 * 500),
      type: MessageTypeEnum.Image,
      size: 1024 * 500,
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
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
