import { useMemo } from 'react';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import {
  getDefaultChannelMessageTypes,
  MessageTypeDisplayStrategy,
} from '@/interfaces/message-type-config.interface';
import { useChatStore } from '@/store';

export interface UseMessageTypeConfigResult {
  /** 当前允许的消息类型列表 */
  allowedTypes: MessageTypeEnum[];
  /** 检查消息类型是否支持 */
  isMessageTypeSupported: (type: MessageTypeEnum) => boolean;
  /** 获取不支持消息的显示策略 */
  getDisplayStrategy: () => MessageTypeDisplayStrategy;
  /** 获取自定义不支持提示文案 */
  getUnsupportedMessage: () => string | undefined;
}

/**
 * 消息类型配置 Hook
 * - 提供当前允许的消息类型列表
 * - 提供检查消息类型是否支持的方法
 * - 提供获取显示策略的方法
 */
export const useMessageTypeConfig = (): UseMessageTypeConfigResult => {
  const strategy = useChatStore((state) => state.strategy);
  const activeChannel = strategy.activeChannel;

  const allowedTypes = useMemo(() => {
    // 如果有渠道级配置，使用渠道级配置
    if (activeChannel && strategy.channelMessageTypeConfigs?.[activeChannel]) {
      const channelConfig = strategy.channelMessageTypeConfigs[activeChannel];
      return channelConfig.allowedTypes;
    }

    // 如果有当前渠道的允许消息类型，使用它
    if (strategy.allowedMessageTypes?.length > 0) {
      return strategy.allowedMessageTypes;
    }

    // 否则使用默认值
    if (activeChannel) {
      return getDefaultChannelMessageTypes(activeChannel);
    }

    // 如果没有激活渠道，返回所有类型
    return [
      MessageTypeEnum.Text,
      MessageTypeEnum.Image,
      MessageTypeEnum.Video,
      MessageTypeEnum.Audio,
      MessageTypeEnum.File,
      MessageTypeEnum.Template,
      MessageTypeEnum.Location,
      MessageTypeEnum.RichMedia,
    ];
  }, [
    activeChannel,
    strategy.allowedMessageTypes,
    strategy.channelMessageTypeConfigs,
  ]);

  const allowedTypesSet = useMemo(() => new Set(allowedTypes), [allowedTypes]);

  const isMessageTypeSupported = (type: MessageTypeEnum): boolean => {
    return allowedTypesSet.has(type);
  };

  const getDisplayStrategy = (): MessageTypeDisplayStrategy => {
    // 如果有渠道级配置，使用渠道级配置
    if (activeChannel && strategy.channelMessageTypeConfigs?.[activeChannel]) {
      const channelConfig = strategy.channelMessageTypeConfigs[activeChannel];
      return (
        channelConfig.displayStrategy ??
        MessageTypeDisplayStrategy.ShowUnsupported
      );
    }

    // 否则使用全局配置
    return strategy.messageDisplayStrategy;
  };

  const getUnsupportedMessage = (): string | undefined => {
    // 如果有渠道级配置，使用渠道级配置
    if (activeChannel && strategy.channelMessageTypeConfigs?.[activeChannel]) {
      const channelConfig = strategy.channelMessageTypeConfigs[activeChannel];
      return channelConfig.unsupportedMessage;
    }

    // 否则使用全局配置
    return strategy.unsupportedMessage;
  };

  return {
    allowedTypes,
    isMessageTypeSupported,
    getDisplayStrategy,
    getUnsupportedMessage,
  };
};
