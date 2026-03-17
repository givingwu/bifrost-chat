import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { useTranslation } from '@/providers/I18n.provider';
import { useServices } from '@/providers/service.provider';
import { ConversationCacheHelper } from '@/services/cache/conversation-cache-helper.service';
import type { ConversationMetadata } from '@/services/core/conversation.service';
import { useActions, useActiveConversationId, useStrategy } from '@/store';
import { useConversationMetadata } from './use-conversation-metadata.hook';
import { useCreateConversation } from './use-create-conversation.hook';

export interface ChannelStateDescriptor {
  /** 当前渠道是否禁用 */
  disabled?: boolean;
  /** 禁用或悬浮提示文案 */
  tooltip?: string;
}

export interface UseChannelSwitcherOptions {
  /** 当前会话支持的渠道列表（可选，显式传入时优先使用） */
  supportedChannels?: ChannelTypeEnum[];
  /** 当前激活的渠道（从 prop 传入） */
  activeChannel?: ChannelTypeEnum;
  /** 渠道切换回调（可选，默认使用 SDK 内置编排） */
  onChannelChange?: (channel: ChannelTypeEnum) => void | Promise<void>;
}

export interface UseChannelSwitcherReturn {
  /** 要显示的渠道列表 */
  channels: readonly ChannelTypeEnum[];
  /** 当前激活的渠道 */
  activeChannel: ChannelTypeEnum;
  /** 各渠道禁用态与提示信息 */
  channelStates: Partial<Record<ChannelTypeEnum, ChannelStateDescriptor>>;
  /** 当前是否正在切换渠道 */
  switchingChannel: ChannelTypeEnum | null;
  /** 处理渠道切换 */
  handleChannelChange: (channel: ChannelTypeEnum) => Promise<void>;
  /** 是否应该显示切换器（多于一个渠道时显示） */
  shouldRender: boolean;
}

function resolveSupportedChannels(
  supportedChannels: ChannelTypeEnum[] | undefined,
  metadata: ConversationMetadata | null,
  fallbackChannel?: ChannelTypeEnum,
): readonly ChannelTypeEnum[] {
  if (supportedChannels && supportedChannels.length > 0) {
    return supportedChannels;
  }

  if (metadata?.supportedChannels && metadata.supportedChannels.length > 0) {
    return metadata.supportedChannels;
  }

  return fallbackChannel ? [fallbackChannel] : [];
}

function resolveSupportedChannelSessionMap(
  metadata: ConversationMetadata | null,
): Partial<Record<ChannelTypeEnum, string>> {
  const sessions = metadata?.supportedChannelSessions;

  if (!sessions || sessions.length === 0) {
    return {};
  }

  return sessions.reduce<Partial<Record<ChannelTypeEnum, string>>>(
    (accumulator, session) => {
      if (session.channelType && session.conversationId) {
        accumulator[session.channelType] = session.conversationId;
      }
      return accumulator;
    },
    {},
  );
}

/**
 * useChannelSwitcher：渠道切换器共享逻辑 hook。
 *
 * @description
 * - 默认渲染宿主下发的 `allowedChannels`
 * - 当前会话支持能力来自完整会话详情缓存
 * - 顶部/输入区统一复用同一套 get/create 切换编排
 * - 显式传入 `supportedChannels` / `onChannelChange` 时，优先遵循调用方意图
 *
 * @example
 * ```tsx
 * const {
 *   channels,
 *   activeChannel,
 *   channelStates,
 *   handleChannelChange,
 * } = useChannelSwitcher();
 * ```
 */
export function useChannelSwitcher(
  options: UseChannelSwitcherOptions = {},
): UseChannelSwitcherReturn {
  const {
    supportedChannels,
    activeChannel: propActiveChannel,
    onChannelChange,
  } = options;
  const queryClient = useQueryClient();
  const { conversationService } = useServices();
  const { t } = useTranslation();
  const { allowedChannels, activeChannel: globalActiveChannel } = useStrategy();
  const {
    setActiveChannel,
    setActiveConversationId,
    setConversationSwitching,
  } = useActions();
  const activeConversationId = useActiveConversationId();
  const { data: activeConversationMetadata } =
    useConversationMetadata(activeConversationId);
  const createConversation = useCreateConversation<{
    sourceChatId: string;
    channelType: ChannelTypeEnum;
  }>(true);
  const [switchingChannel, setSwitchingChannel] =
    useState<ChannelTypeEnum | null>(null);

  const activeConversation = activeConversationId
    ? ConversationCacheHelper.findConversation(
        queryClient,
        activeConversationId,
      )
    : undefined;

  const channels = useMemo(() => {
    if (supportedChannels && supportedChannels.length > 0) {
      return supportedChannels as readonly ChannelTypeEnum[];
    }

    return allowedChannels;
  }, [allowedChannels, supportedChannels]);

  const activeChannel = useMemo(() => {
    return propActiveChannel ?? globalActiveChannel;
  }, [propActiveChannel, globalActiveChannel]);

  const effectiveSupportedChannels = useMemo(
    () =>
      resolveSupportedChannels(
        supportedChannels,
        activeConversationMetadata,
        activeConversation?.channel,
      ),
    [
      activeConversation?.channel,
      activeConversationMetadata,
      supportedChannels,
    ],
  );
  const supportedChannelSessionMap = useMemo(
    () => resolveSupportedChannelSessionMap(activeConversationMetadata),
    [activeConversationMetadata],
  );
  const channelStates = useMemo(() => {
    if (supportedChannels && supportedChannels.length > 0) {
      return {};
    }

    if (!activeConversationId) {
      return {};
    }

    const supportedSet = new Set(effectiveSupportedChannels);

    return channels.reduce<
      Partial<Record<ChannelTypeEnum, ChannelStateDescriptor>>
    >((accumulator, channel) => {
      if (supportedSet.has(channel)) {
        return accumulator;
      }

      accumulator[channel] = {
        disabled: true,
        tooltip: t('toolbar.channelFilter.unsupportedCurrentConversation', {
          channel: t(`toolbar.channel.${channel}`),
        }),
      };
      return accumulator;
    }, {});
  }, [
    activeConversationId,
    channels,
    effectiveSupportedChannels,
    supportedChannels,
    t,
  ]);

  const handleChannelChange = useCallback(
    async (channel: ChannelTypeEnum) => {
      if (channel === activeChannel) {
        return;
      }

      if (channelStates[channel]?.disabled) {
        return;
      }

      if (onChannelChange) {
        await onChannelChange(channel);
        return;
      }

      if (!activeConversationId) {
        setActiveChannel(channel);
        return;
      }

      setConversationSwitching(true);
      setSwitchingChannel(channel);

      try {
        const targetConversationId = supportedChannelSessionMap[channel];

        if (targetConversationId) {
          const nextConversation =
            await conversationService.get(targetConversationId);

          if (nextConversation) {
            ConversationCacheHelper.cacheConversation(
              queryClient,
              nextConversation,
            );
            setActiveChannel(channel);
            setActiveConversationId(nextConversation.id);
            return;
          }
        }

        const nextConversation = await createConversation.mutateAsync({
          sourceChatId: activeConversationId,
          channelType: channel,
        });

        setActiveChannel(channel);
        setActiveConversationId(nextConversation.id);
      } finally {
        setConversationSwitching(false);
        setSwitchingChannel(null);
      }
    },
    [
      activeChannel,
      activeConversationId,
      channelStates,
      conversationService,
      createConversation,
      onChannelChange,
      queryClient,
      setActiveChannel,
      setActiveConversationId,
      setConversationSwitching,
      supportedChannelSessionMap,
    ],
  );

  return {
    channels,
    activeChannel,
    channelStates,
    switchingChannel,
    handleChannelChange,
    shouldRender: channels.length > 1,
  };
}
