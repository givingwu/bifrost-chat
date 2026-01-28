import type { ChannelType } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';

export interface ComposerStrategyProps {
  /** 当前激活渠道 */
  channel?: ChannelType;
  /** 输入内容 */
  value: string;
  /** 内容变更回调 */
  onChange: (value: string) => void;
}

/**
 * ComposerStrategy：输入框策略骨架。
 * - 真实实现需依据 channel 切换能力（SMS/WhatsApp/Email）。
 */
export const ComposerStrategy = ({
  channel,
  value,
  onChange,
}: ComposerStrategyProps) => {
  const { t } = useTranslation();
  const placeholder = channel
    ? t('composer.placeholder.channel', { channel })
    : t('composer.placeholder.default');

  return (
    <div
      data-component="composer"
      data-channel={channel}
      className="rounded-xl border border-border bg-card p-4 shadow-soft"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-text-muted">
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-text-muted">
          {channel ?? 'default'}
        </span>
        <span>{value.length} chars</span>
      </div>
      <textarea
        value={value}
        placeholder={placeholder}
        className="h-24 w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm text-text outline-none focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {t('composer.send', { channel: channel ?? 'default' })}
        </button>
      </div>
    </div>
  );
};
