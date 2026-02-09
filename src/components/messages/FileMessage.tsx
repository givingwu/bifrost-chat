import { Download, FileText } from 'lucide-react';
import type { MessageContent } from '@/interfaces/message.interface';

export interface FileMessageProps {
  /** 消息内容 */
  content: MessageContent;
}

/**
 * FileMessage：文件消息组件。
 * - 渲染文件消息，显示文件名、大小和下载按钮。
 */
export const FileMessage = ({ content }: FileMessageProps) => {
  if (!('url' in content)) {
    return null;
  }

  const fileName = content.url.split('/').pop() || 'Unknown file';
  const fileSize = content.size
    ? `${(content.size / 1024).toFixed(1)} KB`
    : 'Unknown size';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-text">{fileName}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{fileSize}</p>
      </div>
      <a
        href={content.url}
        download={fileName}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition"
      >
        <Download className="h-4 w-4 text-primary" />
      </a>
    </div>
  );
};
