import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type WebSocketConfig,
  type WebSocketEventData,
  WebSocketManager,
  WebSocketStatusEnum,
} from '@/services/websocket-manager.service';

/**
 * useWebSocket Hook 返回值
 */
export interface UseWebSocketReturn {
  /** WebSocket 连接状态 */
  status: WebSocketStatusEnum;
  /** 是否已连接 */
  isConnected: boolean;
  /** 连接 WebSocket */
  connect: () => Promise<void>;
  /** 断开连接 */
  disconnect: () => void;
  /** 发送消息 */
  send: (data: unknown) => void;
  /** WebSocket 管理器实例（用于高级用法） */
  manager: WebSocketManager | null;
}

/**
 * useWebSocket Hook 配置
 */
export interface UseWebSocketConfig {
  /** WebSocket 服务器 URL */
  url: string;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 连接超时（毫秒） */
  connectionTimeout?: number;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 认证 Token */
  token?: string;
  /** 是否自动连接 */
  autoConnect?: boolean;
  /** 消息回调 */
  onMessage?: (data: WebSocketEventData) => void;
}

/**
 * useWebSocket：WebSocket Hook
 *
 * @description
 * 提供 WebSocket 连接的 React Hook，自动管理连接生命周期。
 * 支持自动连接、状态监听、消息收发等功能。
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { status, isConnected, send } = useWebSocket({
 *     url: 'wss://api.example.com/ws',
 *     token: 'your-token',
 *     autoConnect: true,
 *   });
 *
 *   return (
 *     <div>
 *       <p>状态: {status}</p>
 *       <button onClick={() => send({ type: 'chat', content: 'Hello' })}>
 *         发送消息
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example 配合 React Query 使用
 * ```tsx
 * function ChatComponent() {
 *   const queryClient = useQueryClient();
 *
 *   useWebSocket({
 *     url: 'wss://api.example.com/ws',
 *     token: 'your-token',
 *     onMessage: (data) => {
 *       // 更新 React Query 缓存
 *       if (data.type === 'message') {
 *         queryClient.setQueryData(
 *           ['messages', data.conversationId],
 *           (old: StandardMessage[] = []) => [...old, data.message]
 *         );
 *       }
 *     },
 *   });
 *
 *   // ...
 * }
 * ```
 */
export function useWebSocket(config: UseWebSocketConfig): UseWebSocketReturn {
  const managerRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<WebSocketStatusEnum>(
    WebSocketStatusEnum.Disconnected,
  );
  const onMessageRef = useRef(config.onMessage);

  // 更新 onMessage 引用
  useEffect(() => {
    onMessageRef.current = config.onMessage;
  }, [config.onMessage]);

  // 初始化 WebSocketManager
  useEffect(() => {
    if (!config.url) {
      return;
    }

    const manager = new WebSocketManager({
      url: config.url,
      heartbeatInterval: config.heartbeatInterval,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts,
      connectionTimeout: config.connectionTimeout,
      autoReconnect: config.autoReconnect,
      token: config.token,
    });

    managerRef.current = manager;

    // 监听状态变化
    const unsubscribeStatus = manager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // 监听消息事件
    const unsubscribeMessage = manager.onMessage((data) => {
      onMessageRef.current?.(data);
    });

    // 清理
    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      manager.destroy();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.url,
    config.heartbeatInterval,
    config.reconnectInterval,
    config.maxReconnectAttempts,
    config.connectionTimeout,
    config.autoReconnect,
    config.token,
  ]);

  // 自动连接
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !config.autoConnect) {
      return;
    }

    manager.connect().catch((error) => {
      console.error('Auto connect failed:', error);
    });
  }, [config.autoConnect]);

  // 连接方法
  const connect = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) {
      throw new Error('WebSocketManager not initialized');
    }
    return manager.connect();
  }, []);

  // 断开连接方法
  const disconnect = useCallback(() => {
    const manager = managerRef.current;
    if (!manager) {
      return;
    }
    manager.disconnect();
  }, []);

  // 发送消息方法
  const send = useCallback((data: unknown) => {
    const manager = managerRef.current;
    if (!manager) {
      throw new Error('WebSocketManager not initialized');
    }
    manager.send(data);
  }, []);

  return {
    status,
    isConnected: status === WebSocketStatusEnum.Connected,
    connect,
    disconnect,
    send,
    manager: managerRef.current,
  };
}

/**
 * useWebSocketMessage：监听特定类型消息的 Hook
 *
 * @description
 * 监听 WebSocket 消息，当收到指定类型的消息时触发回调。
 *
 * @example
 * ```tsx
 * function ChatMessages() {
 *   const queryClient = useQueryClient();
 *
 *   useWebSocketMessage('message', (data) => {
 *     // 处理新消息
 *     queryClient.setQueryData(
 *       ['messages', data.conversationId],
 *       (old: StandardMessage[] = []) => [...old, data.message]
 *     );
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWebSocketMessage(
  _messageType: string,
  _callback: (data: unknown) => void,
): void {
  useEffect(() => {
    // 这个 Hook 需要通过某种方式获取 WebSocketManager 实例
    // 可以通过 Context 或者全局单例来实现
    // 这里只是一个示例，实际实现需要根据项目架构调整

    // TODO: 实现 WebSocket 消息监听
    // const unsubscribe = manager.onMessage((data) => {
    //   if (data.type === messageType) {
    //     callback(data.data);
    //   }
    // });
    //
    // return unsubscribe;

    console.warn('useWebSocketMessage not implemented yet');
  }, []);
}
