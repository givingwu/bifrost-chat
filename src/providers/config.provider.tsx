import type { ReactNode } from 'react';
import { createContext, useContext, useRef } from 'react';
import { type ChatStoreInitialState, configureChatStore } from '@/store';

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
 * ConfigProvider 组件
 *
 * @description
 * 用于集中注入 SDK 配置。配置结构与 ChatStoreState 对齐（actions 除外），
 * 最终由 ChatContainer 在初始化 store 时消费。
 */
export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    configureChatStore(config);
    initializedRef.current = true;
  }

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
