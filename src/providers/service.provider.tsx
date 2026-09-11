import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { NotImplementedError } from '@/errors/sdk.errors';
import { useHostNetworkSync } from '@/hooks/use-host-network-sync.hook';
import type { IConversationService } from '@/services/core/conversation.service';
import type { IMessageService } from '@/services/core/message.service';
import type { INetworkService } from '@/services/core/network.service';
import type { ITemplateService } from '@/services/core/template.service';
import type { OfflineMessageQueueService } from '@/services/messaging/offline-message-queue.service';

/**
 * 服务上下文类型
 */
export interface ServiceContextValue {
  /** 会话服务 */
  conversationService: IConversationService;
  /** 消息服务 */
  messageService: IMessageService;
  /** 模版服务 */
  templateService: ITemplateService;
  /** Host 网络状态服务（可选） */
  networkService?: INetworkService;
  /**
   * 离线消息队列服务（可选）
   * @description
   * 由调用方通过 ServiceProvider 注入
   * 不提供时为 undefined，需要手动处理离线消息
   */
  offlineMessageQueue?: OfflineMessageQueueService;
}

/**
 * 服务上下文
 */
export const ServiceContext = createContext<ServiceContextValue | null>(null);

/**
 * 使用服务上下文的 Hook
 * @throws {Error} 如果在 ServiceProvider 外部使用
 */
export function useServices(): ServiceContextValue {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error(
      'useServices must be used within a ServiceProvider. ' +
        'Wrap your component tree with <ServiceProvider>.',
    );
  }
  return context;
}

/**
 * ServiceProvider Props
 */
export interface ServiceProviderProps {
  children: ReactNode;
  /** 会话服务实现 */
  conversationService: IConversationService;
  /** 消息服务实现 */
  messageService: IMessageService;
  /** 模版服务实现 */
  templateService: ITemplateService;
  /**
   * 离线消息队列服务（可选）
   * @description
   * 如果提供，将注入到服务上下文中
   * 由宿主应用自行管理其生命周期
   */
  offlineMessageQueue?: OfflineMessageQueueService;
  /** Host 网络状态服务（可选） */
  networkService?: INetworkService;
}

/**
 * ServiceProvider 组件
 *
 * @description
 * 提供服务实现的依赖注入。
 * 调用方需要提供具体的服务实现，SDK 通过 Context 暴露给内部组件使用。
 *
 * @example
 * ```tsx
 * import { ServiceProvider } from '@feoe/bifrost-chat';
 * import { MyConversationService } from './services/conversation.service';
 * import { MyMessageService } from './services/message.service';
 * import { MyTemplateService } from './services/template.service';
 *
 * function App() {
 *   return (
 *     <ServiceProvider
 *       conversationService={new MyConversationService()}
 *       messageService={new MyMessageService()}
 *       templateService={new MyTemplateService()}
 *     >
 *       <ChatContainer />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function ServiceProvider({
  children,
  conversationService,
  messageService,
  templateService,
  offlineMessageQueue,
  networkService,
}: ServiceProviderProps) {
  useHostNetworkSync(networkService);

  // [P2-1 To-Be] 当前不支持同页多实例。
  // Zustand store 和 QueryClient 均为模块级单例，多个 ServiceProvider 会共享状态。
  // 如页面需要同时渲染多个独立的 SDK 实例，请参阅 AGENTS.md 的 To-Be 架构规划。
  const parentContext = useContext(ServiceContext);
  if (process.env.NODE_ENV === 'development' && parentContext !== null) {
    console.warn(
      '[Bifrost SDK] ⚠️ 检测到嵌套 ServiceProvider 实例。' +
        '当前版本不支持多实例隔离，多个实例会共享 store 和缓存状态。' +
        '如需支持多实例，请参阅 AGENTS.md 中的 P2-1 To-Be 规划。',
    );
  }

  const value: ServiceContextValue = useMemo(() => {
    return {
      conversationService,
      messageService,
      templateService,
      offlineMessageQueue,
      networkService,
    };
  }, [
    conversationService,
    messageService,
    templateService,
    offlineMessageQueue,
    networkService,
  ]);

  return (
    <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
  );
}

/**
 * 创建默认的空服务实现（用于开发/测试）
 * 所有方法都会抛出 NotImplementedError
 */
export function createNotImplementedServices(): ServiceContextValue {
  const notImplementedError = new NotImplementedError(
    'Service implementation not provided. Please provide service implementations via ServiceProvider.',
  );

  const createNotImplementedProxy = <T extends object>(): T => {
    return new Proxy({} as T, {
      get() {
        return () => Promise.reject(notImplementedError);
      },
    });
  };

  return {
    conversationService: createNotImplementedProxy<IConversationService>(),
    messageService: createNotImplementedProxy<IMessageService>(),
    templateService: createNotImplementedProxy<ITemplateService>(),
    offlineMessageQueue: undefined,
    networkService: undefined,
  };
}
