import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  type ChatStoreInitialState,
  type ChatStoreState,
  configureChatStore,
  useChatStore,
} from '@/store';

export interface IConfigSettings extends ChatStoreInitialState {}

/**
 * SDK Config 上下文（与 ChatStoreState 结构对齐）
 */
const ConfigContext = createContext<IConfigSettings | null>(null);

export interface ConfigProviderProps {
  children: ReactNode;
  /** SDK 配置（用于初始化 Store 状态） */
  config: IConfigSettings;
}

/**
 * Reset config settings - 重置默认配置
 * @param config
 * @param initialState
 * @returns
 */
export const resetConfigSettings = (
  config: IConfigSettings,
  initialState: ChatStoreState,
) => {
  if (
    config.strategy &&
    config.strategy?.activeChannel !== initialState.strategy.activeChannel
  ) {
    const allowChannel = config.strategy.allowedChannels;

    if (allowChannel?.length) {
      config.strategy = {
        ...initialState.strategy,
        ...config.strategy,
        activeChannel: allowChannel[0],
      };
    }
  }

  return config;
};

/**
 * ConfigProvider 组件
 *
 * @description
 * 用于集中注入 SDK 配置。配置结构与 ChatStoreState 对齐（actions 除外），
 * 当配置语义变化时会重置并重新初始化全局 store，避免不同入口之间残留状态串场。
 */
export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  const appliedSignatureRef = useRef<string | undefined>(undefined);
  const configSignature = useMemo(() => JSON.stringify(config), [config]);

  if (appliedSignatureRef.current === undefined) {
    const initialState = useChatStore.getInitialState();

    useChatStore.setState(initialState, true);
    appliedSignatureRef.current = configSignature;
    configureChatStore(resetConfigSettings(config, initialState));
  }

  useEffect(() => {
    if (appliedSignatureRef.current === configSignature) {
      return;
    }

    const initialState = useChatStore.getInitialState();

    useChatStore.setState(initialState, true);
    appliedSignatureRef.current = configSignature;
    configureChatStore(resetConfigSettings(config, initialState));
  }, [config, configSignature]);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

/**
 * 读取 ConfigProvider 注入的配置
 */
export const useConfig = () => {
  return useContext(ConfigContext);
};
