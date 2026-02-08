import { File, FileText, Image as ImageIcon, Video, X } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/utils/class.util';
import { TEST_IDS } from './composer.constants';

/**
 * 附件类型
 */
export type AttachmentType = 'image' | 'video' | 'document' | 'other';

/**
 * 附件信息
 */
export interface Attachment {
  /** 文件对象 */
  file: File;
  /** 预览 URL（对于图片/视频） */
  preview?: string;
  /** 附件类型 */
  type: AttachmentType;
  /** 文件大小（格式化后） */
  size: string;
}

export interface AttachmentPreviewProps {
  /** 附件列表 */
  attachments: Attachment[];
  /** 移除附件的回调 */
  onRemove: (index: number) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 获取附件类型
 */
function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  if (
    file.type.includes('pdf') ||
    file.type.includes('document') ||
    file.type.includes('text') ||
    file.type.includes('sheet') ||
    file.type.includes('presentation')
  ) {
    return 'document';
  }
  return 'other';
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * 获取附件图标
 */
function getAttachmentIcon(type: AttachmentType) {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'video':
      return Video;
    case 'document':
      return FileText;
    default:
      return File;
  }
}

/**
 * AttachmentPreview 组件
 *
 * 显示附件预览列表，支持移除附件
 *
 * @example
 * ```tsx
 * <AttachmentPreview
 *   attachments={attachments}
 *   onRemove={(index) => removeAttachment(index)}
 * />
 * ```
 */
export const AttachmentPreview = memo<AttachmentPreviewProps>(
  ({ attachments, onRemove, disabled = false }) => {
    if (attachments.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'flex flex-wrap gap-2',
          'animate-in fade-in slide-in-from-bottom-2 duration-200',
        )}
        data-testid={TEST_IDS.COMPOSER_ATTACH}
      >
        {attachments.map((attachment, index) => {
          const Icon = getAttachmentIcon(attachment.type);

          return (
            <div
              key={`${attachment.file.name}-${index}`}
              className={cn(
                'group relative flex items-center gap-2',
                'rounded-lg border border-border bg-muted/50 px-3 py-2',
                'transition-all duration-200',
                'hover:bg-muted',
                disabled && 'opacity-50',
              )}
            >
              {/* 图标 */}
              <div className="shrink-0">
                <Icon className="h-4 w-4 text-text-muted" />
              </div>

              {/* 文件信息 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-text">
                  {attachment.file.name}
                </span>
                <span className="text-[10px] text-text-muted">
                  {attachment.size}
                </span>
              </div>

              {/* 移除按钮 */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className={cn(
                    'shrink-0 rounded-full p-0.5',
                    'text-text-muted transition-colors duration-150',
                    'hover:bg-destructive/10 hover:text-destructive',
                    'focus:outline-none focus:ring-2 focus:ring-destructive/40',
                  )}
                  aria-label={`Remove ${attachment.file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* 图片预览 */}
              {attachment.type === 'image' && attachment.preview && (
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-full w-full object-cover blur-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

AttachmentPreview.displayName = 'AttachmentPreview';

/**
 * 处理文件选择并创建附件对象
 */
export async function createAttachments(files: File[]): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  for (const file of files) {
    const type = getAttachmentType(file);
    const size = formatFileSize(file.size);
    let preview: string | undefined;

    // 为图片和视频创建预览
    if (type === 'image' || type === 'video') {
      preview = URL.createObjectURL(file);
    }

    attachments.push({ file, preview, type, size });
  }

  return attachments;
}

/**
 * 清理附件预览 URL
 */
export function revokeAttachmentPreviews(attachments: Attachment[]): void {
  for (const attachment of attachments) {
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
  }
}
