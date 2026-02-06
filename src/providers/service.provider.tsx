import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { NotImplementedError } from '@/interfaces/error.interface';
import type { IConversationService } from '@/services/conversation.service';
import type { IMessageService } from '@/services/message.service';
import type { ITemplateService } from '@/services/template.service';

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
}: ServiceProviderProps) {
  const value: ServiceContextValue = useMemo(() => {
    return {
      conversationService,
      messageService,
      templateService,
    };
  }, [conversationService, messageService, templateService]);

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
  };
}
