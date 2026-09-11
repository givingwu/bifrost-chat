import { useCallback, useMemo } from 'react';
import { MessageTypeEnum } from '@/interfaces/message.interface';
import type { MessageTypeDisplayStrategy } from '@/interfaces/message-type-config.interface';
import { useChatStore } from '@/store';
import { getDefaultChannelMessageTypes } from '@/utils/channel.utils';

/**
 * 所有可用消息类型的常量列表
 * 用于无激活渠道时的默认值
 */
const ALL_MESSAGE_TYPES: MessageTypeEnum[] = [
  MessageTypeEnum.Text,
  MessageTypeEnum.Image,
  MessageTypeEnum.Video,
  MessageTypeEnum.Audio,
  MessageTypeEnum.File,
  MessageTypeEnum.Template,
  MessageTypeEnum.Location,
  MessageTypeEnum.RichMedia,
] as const;

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
 *
 * 配置优先级（从高到低）：
 * 1. 渠道级配置 (channelMessageTypeConfigs[activeChannel])
 * 2. 全局配置 (allowedMessageTypes / messageDisplayStrategy / unsupportedMessage)
 * 3. 渠道默认值 (getDefaultChannelMessageTypes)
 * 4. SDK 默认值 (ALL_MESSAGE_TYPES / ShowUnsupported)
 */
export const useMessageTypeConfig = (): UseMessageTypeConfigResult => {
  const strategy = useChatStore((state) => state.strategy);
  const activeChannel = strategy.activeChannel;

  /**
   * 获取当前渠道的配置
   * 如果没有渠道级配置，返回 undefined
   */
  const channelConfig = useMemo(() => {
    if (!activeChannel) {
      return undefined;
    }
    return strategy.channelMessageTypeConfigs?.[activeChannel];
  }, [activeChannel, strategy.channelMessageTypeConfigs]);

  /**
   * 计算当前允许的消息类型列表
   * 优先级：渠道配置 > 全局配置 > 渠道默认值 > SDK 默认值
   */
  const allowedTypes = useMemo(() => {
    // 优先级 1: 渠道级配置
    const channelAllowedTypes = channelConfig?.allowedTypes;
    if (channelAllowedTypes && channelAllowedTypes.length > 0) {
      return channelAllowedTypes;
    }

    // 优先级 2: 全局配置
    if (strategy.allowedMessageTypes?.length > 0) {
      return strategy.allowedMessageTypes;
    }

    // 优先级 3: 渠道默认值
    if (activeChannel) {
      const defaultTypes = getDefaultChannelMessageTypes(activeChannel);
      if (defaultTypes?.length > 0) {
        return defaultTypes;
      }
    }

    // 优先级 4: SDK 默认值（所有类型）
    return [...ALL_MESSAGE_TYPES];
  }, [channelConfig, strategy.allowedMessageTypes, activeChannel]);

  /**
   * 允许的消息类型集合，用于快速查找
   */
  const allowedTypesSet = useMemo(() => new Set(allowedTypes), [allowedTypes]);

  /**
   * 检查消息类型是否支持
   * 使用 useCallback 缓存函数引用，避免子组件不必要的重渲染
   */
  const isMessageTypeSupported = useCallback(
    (type: MessageTypeEnum): boolean => {
      // 验证输入是否为有效的 MessageTypeEnum
      if (type === undefined || type === null) {
        return false;
      }
      return allowedTypesSet.has(type);
    },
    [allowedTypesSet],
  );

  /**
   * 获取不支持消息的显示策略
   * 优先级：渠道配置 > 全局配置 > SDK 默认值
   */
  const displayStrategy = useMemo(() => {
    // 优先级 1: 渠道级配置
    if (channelConfig?.displayStrategy !== undefined) {
      return channelConfig.displayStrategy;
    }

    // 优先级 2: 全局配置
    return strategy.messageDisplayStrategy;
  }, [channelConfig, strategy.messageDisplayStrategy]);

  /**
   * 获取不支持消息的自定义提示文案
   * 优先级：渠道配置 > 全局配置
   */
  const unsupportedMessage = useMemo(() => {
    // 优先级 1: 渠道级配置
    if (channelConfig?.unsupportedMessage !== undefined) {
      return channelConfig.unsupportedMessage;
    }

    // 优先级 2: 全局配置
    return strategy.unsupportedMessage;
  }, [channelConfig, strategy.unsupportedMessage]);

  /**
   * 获取显示策略的函数
   * 使用 useCallback 缓存函数引用
   */
  const getDisplayStrategy = useCallback((): MessageTypeDisplayStrategy => {
    return displayStrategy;
  }, [displayStrategy]);

  /**
   * 获取不支持提示文案的函数
   * 使用 useCallback 缓存函数引用
   */
  const getUnsupportedMessage = useCallback((): string | undefined => {
    return unsupportedMessage;
  }, [unsupportedMessage]);

  return {
    allowedTypes,
    isMessageTypeSupported,
    getDisplayStrategy,
    getUnsupportedMessage,
  };
};
