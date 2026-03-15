import { ShieldCheck } from 'lucide-react';
import { memo } from 'react';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { cn } from '@/utils/class.util';
import {
  BUTTON_SIZES,
  CHANNEL_HINTS,
  TEST_IDS,
  TEXT_SIZES,
} from './composer.constants';

export interface ComposerHintProps {
  /** 当前渠道类型 */
  channel?: ChannelTypeEnum;
}

/**
 * ComposerHint 组件
 *
 * 根据当前渠道显示相应的提示信息
 *
 * @example
 * ```tsx
 * <ComposerHint channel="whatsapp" />
 * ```
 */
export const ComposerHint = memo<ComposerHintProps>(({ channel }) => {
  const { t } = useTranslation();
  // 使用映射表获取提示信息的 i18n key
  const hint = channel
    ? (CHANNEL_HINTS[channel] ?? CHANNEL_HINTS.default)
    : null;

  if (!hint) {
    return null;
  }

  const isWhatsApp = channel === ChannelTypeEnum.WhatsApp;

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        TEXT_SIZES.HINT,
        'text-gray-400 dark:text-gray-500',
      )}
      data-testid={TEST_IDS.COMPOSER_HINT}
    >
      {isWhatsApp && (
        <ShieldCheck
          className={cn(BUTTON_SIZES.ICON_MEDIUM, 'text-success')}
          aria-hidden="true"
        />
      )}
      <span>{t(hint)}</span>
    </div>
  );
});

ComposerHint.displayName = 'ComposerHint';
