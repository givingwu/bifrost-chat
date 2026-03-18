import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { Conversation } from '@/interfaces/conversation.interface';

/**
 * 翻译键常量
 */
export const TRANSLATION_KEYS = {
  TITLE: 'title',
  CONVERSATION_TITLE: 'conversation.title',
  CONVERSATION_STATUS: 'conversation.status',
  TOOLBAR_CHANNEL: 'toolbar.channel',
  TOOLBAR_CHANNEL_FILTER:
    'toolbar.channelFilter.unsupportedCurrentConversation',
} as const;

/**
 * 检查渠道是否被会话支持
 * @param conversation 会话对象
 * @param channel 要检查的渠道
 * @returns 渠道是否被支持
 */
export function checkChannelSupport(
  conversation: Conversation | undefined,
  channel: ChannelTypeEnum,
): boolean {
  if (!conversation) return true;
  const { supportedChannels } = conversation;
  if (!supportedChannels || supportedChannels.length === 0) return true;
  return supportedChannels.includes(channel);
}

/**
 * 获取会话显示标题
 * @param conversation 会话对象
 * @param formatter 自定义格式化函数
 * @param fallback 默认标题
 * @returns 显示标题
 */
export function getDisplayTitle(
  conversation: Conversation | undefined,
  formatter: ((conversation: Conversation) => string) | undefined,
  fallback: string,
): string {
  if (!conversation) return fallback;
  if (formatter) return formatter(conversation);
  return conversation.user?.name ?? fallback;
}

/**
 * 构建副标题节点
 * @param conversation 会话对象
 * @param activeChannel 当前激活渠道
 * @param customSubTitle 自定义副标题
 * @param renderTopbarMeta 渲染 Topbar 元数据的函数
 * @param t 翻译函数
 * @returns 副标题节点
 */
/**
 * 构建副标题节点
 */
export function buildSubTitleNode(
  conversation: Conversation | undefined,
  activeChannel: ChannelTypeEnum,
  customSubTitle: React.ReactNode,
  renderTopbarMeta:
    | ((conversation?: Conversation) => React.ReactNode)
    | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): React.ReactNode {
  if (customSubTitle) return customSubTitle;

  if (conversation) {
    const channelLabel = t(
      `${TRANSLATION_KEYS.TOOLBAR_CHANNEL}.${conversation.channel}`,
    );
    const statusLabel = t(
      `${TRANSLATION_KEYS.CONVERSATION_STATUS}.${conversation.status || 'active'}`,
    );

    return (
      <>
        {`${channelLabel} · ${statusLabel}`}
        {renderTopbarMeta ? renderTopbarMeta(conversation) : undefined}
      </>
    );
  }

  return activeChannel;
}
