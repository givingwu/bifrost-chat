import type { Meta } from 'storybook-react-rsbuild';
import { ComposerAttachments } from '@/components/composer/ComposerAttachments';
import '@/styles/theme.css';

/**
 * ComposerAttachments 组件 Story 文档
 *
 * 展示附件上传按钮的各种用法：
 * - 基础附件上传
 * - 文件类型限制
 * - 多文件上传
 * - 禁用状态
 */

const meta: Meta<typeof ComposerAttachments> = {
  title: 'Composer/ComposerAttachments',
  component: ComposerAttachments,
  tags: ['autodocs'],
  argTypes: {
    accept: {
      control: 'text',
      description: '接受的文件类型（MIME 类型或扩展名）',
    },
    multiple: {
      control: 'boolean',
      description: '是否允许多文件选择',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    onAttachmentSelect: {
      control: false,
      description: '文件选择回调函数',
    },
  },
};

export default meta;

/**
 * 基础示例 - 默认附件上传
 */
export const Default = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        onAttachmentSelect={(files) => console.log('Selected files:', files)}
      />
    </div>
  );
};

/**
 * 仅允许图片
 */
export const ImagesOnly = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        accept="image/*"
        onAttachmentSelect={(files) => console.log('Selected images:', files)}
      />
    </div>
  );
};

/**
 * 仅允许 PDF 文件
 */
export const PDFsOnly = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        accept=".pdf"
        onAttachmentSelect={(files) => console.log('Selected PDFs:', files)}
      />
    </div>
  );
};

/**
 * 多文件上传
 */
export const MultipleFiles = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        multiple
        onAttachmentSelect={(files) => console.log('Selected files:', files)}
      />
    </div>
  );
};

/**
 * 禁用状态
 */
export const Disabled = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        disabled
        onAttachmentSelect={(files) => console.log('Selected files:', files)}
      />
    </div>
  );
};

/**
 * 允许多种文件类型
 */
export const MultipleTypes = () => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <ComposerAttachments
        accept="image/*,.pdf,.doc,.docx"
        multiple
        onAttachmentSelect={(files) => console.log('Selected files:', files)}
      />
    </div>
  );
};

/**
 * 在工具栏中使用
 */
export const InToolbar = () => {
  return (
    <div className="flex items-center gap-2 p-4 bg-card rounded-lg border border-border">
      <ComposerAttachments
        accept="image/*,.pdf"
        onAttachmentSelect={(files) => console.log('Selected files:', files)}
      />
      <span className="text-sm text-text-muted">|</span>
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-text hover:bg-muted rounded-md transition"
      >
        表情
      </button>
      <button
        type="button"
        className="px-3 py-1.5 text-sm text-primary hover:bg-muted rounded-md transition"
      >
        发送
      </button>
    </div>
  );
};
