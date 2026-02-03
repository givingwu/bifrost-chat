import { Paperclip } from 'lucide-react';
import { type ChangeEvent, type MouseEvent, memo } from 'react';
import { IconButton } from '@/components/IconButton';
import { ARIA_LABELS, BUTTON_SIZES, TEST_IDS } from './composer.constants';

export interface ComposerAttachmentsProps {
  /** 是否禁用 */
  disabled?: boolean;
  /** 附件选择回调 */
  onAttachmentSelect?: (files: File[]) => void;
  /** 允许的文件类型 */
  accept?: string;
  /** 是否支持多文件上传 */
  multiple?: boolean;
}

/**
 * ComposerAttachments 组件
 *
 * 提供文件附件上传功能
 *
 * @example
 * ```tsx
 * <ComposerAttachments
 *   onAttachmentSelect={handleFiles}
 *   accept="image/*,.pdf"
 *   multiple
 * />
 * ```
 */
export const ComposerAttachments = memo<ComposerAttachmentsProps>(
  ({
    disabled = false,
    onAttachmentSelect,
    accept = '*',
    multiple = false,
  }) => {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      // 触发隐藏的文件输入框
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.style.display = 'none';

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const files = Array.from(target.files);
          onAttachmentSelect?.(files);
        }
        // 清理
        input.remove();
      };

      input.oncancel = () => {
        input.remove();
      };

      document.body.appendChild(input);
      input.click();
    };

    return (
      <div className="flex items-center gap-2">
        <IconButton
          icon={<Paperclip className={BUTTON_SIZES.ICON_MEDIUM} />}
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleClick}
          aria-label={ARIA_LABELS.ATTACHMENT}
          data-testid={TEST_IDS.COMPOSER_ATTACH}
        />
      </div>
    );
  },
);

ComposerAttachments.displayName = 'ComposerAttachments';
