import type { ChannelType } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import { ComposerActions } from './ComposerActions';
import { ComposerAttachments } from './ComposerAttachments';
import { ComposerHint } from './ComposerHint';
import { ComposerInput } from './ComposerInput';

export interface ComposerToolbarProps {
  /** 当前激活渠道 */
  channel?: ChannelType;
  /** 输入内容 */
  value: string;
  /** 内容变更回调 */
  onChange: (value: string) => void;
  /** 发送回调 */
  onSend?: () => void;
}

/**
 * ComposerToolbar：输入框策略工具栏。
 * - 保留原有 props，对齐 DEMO UI 结构。
 */
export const ComposerToolbar = ({
  channel,
  value,
  onChange,
  onSend,
}: ComposerToolbarProps) => {
  const { t } = useTranslation();
  const placeholder = channel
    ? t('composer.placeholder.channel', { channel })
    : t('composer.placeholder.default');
  const canSend = value.trim().length > 0;

  return (
    <div
      data-component="composer"
      data-channel={channel}
      className={cn(
        'rounded-2xl border border-border bg-card/80 px-4 py-3',
        'shadow-soft backdrop-blur-md',
      )}
    >
      <div className="flex items-center gap-3">
        <ComposerAttachments disabled={false} />
        <ComposerInput
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
        <ComposerActions canSend={canSend} onSend={onSend} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
        <span className="rounded-full border border-border px-2.5 py-1">
          {channel ?? 'default'}
        </span>
        <div className="flex items-center gap-3">
          <ComposerHint channel={channel} />
          <span>{value.length} chars</span>
        </div>
      </div>
    </div>
  );
};
