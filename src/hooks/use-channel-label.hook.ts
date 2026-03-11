import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';

/**
 * useChannelLabel：返回渠道名称翻译函数
 *
 * @example
 * const getLabel = useChannelLabel();
 * getLabel(ChannelTypeEnum.SMS); // '交互短信' | 'Interactive SMS'
 */
export const useChannelLabel = () => {
    const { t } = useTranslation();
    return (channel: ChannelTypeEnum): string =>
        t(`toolbar.channel.${channel.toLowerCase()}` as Parameters<typeof t>[0]) ||
        channel;
};
