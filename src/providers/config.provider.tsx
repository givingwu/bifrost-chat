import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { ChatStoreInitialState } from '@/store';

/**
 * SDK Config 上下文（与 ChatStoreState 结构对齐）
 */
const ConfigContext = createContext<ChatStoreInitialState | null>(null);

export interface ConfigProviderProps {
  children: ReactNode;
  /** SDK 配置（用于初始化 Store 状态） */
  config: ChatStoreInitialState;
}

/**
 * ConfigProvider 组件
 *
 * @description
 * 用于集中注入 SDK 配置。配置结构与 ChatStoreState 对齐（actions 除外），
 * 最终由 ChatContainer 在初始化 store 时消费。
 */
export const ConfigProvider = ({ children, config }: ConfigProviderProps) => {
  const value = useMemo(() => config, [config]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

/**
 * 读取 ConfigProvider 注入的配置
 */
export const useConfig = () => {
  return useContext(ConfigContext);
};
