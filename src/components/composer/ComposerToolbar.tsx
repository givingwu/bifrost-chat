import { useCallback, useState } from 'react';
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
  /** 发送回调 */
  onSend?: (message?: string) => void;
}

/**
 * ComposerToolbar：输入框策略工具栏。
 */
export const ComposerToolbar = ({ channel, onSend }: ComposerToolbarProps) => {
  const { t } = useTranslation();
  const [value, onChange] = useState('');
  const placeholder = channel
    ? t('composer.placeholder.channel', { channel })
    : t('composer.placeholder.default');
  const canSend = value.trim().length > 0;
  const handleSend = useCallback(() => {
    if (canSend) {
      onSend?.(value.trim());
      onChange('');
    }
  }, [canSend, onSend, value]);

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
          onEnter={handleSend}
        />
        <ComposerActions canSend={canSend} onSend={handleSend} />
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
