import type { QueryClient } from '@tanstack/react-query';
import type { StandardMessage } from '@/interfaces/message.interface';
import { queryKeys } from '@/providers/query.provider';
import { MessageCacheHelper } from '@/services/message-cache-helper.service';

/**
 * WebSocket 消息类型
 */
export enum WebSocketMessageType {
  /** 新消息 */
  NewMessage = 'new_message',
  /** 消息状态更新 */
  MessageStatus = 'message_status',
  /** 会话更新 */
  ConversationUpdate = 'conversation_update',
  /** 会话列表更新 */
  ConversationListUpdate = 'conversation_list_update',
  /** 新会话 */
  NewConversation = 'new_conversation',
}

/**
 * WebSocket 消息数据
 */
export interface WebSocketMessageData {
  /** 消息类型 */
  type: WebSocketMessageType;
  /** 会话 ID */
  conversationId?: string;
  /** 消息数据 */
  message?: StandardMessage;
  /** 消息 ID */
  messageId?: string;
  /** 消息状态 */
  status?: string;
}

/**
 * 集成 WebSocket 到 React Query Cache
 *
 * @description
 * 提供 WebSocket 消息到 React Query Cache 的集成逻辑。
 * 当收到 WebSocket 消息时，自动更新 React Query 缓存。
 *
 * @example
 * ```tsx
 * import { useWebSocket } from '@/hooks/use-websocket.hook';
 * import { integrateWebSocketWithQueryClient } from '@/react-query/websocket-integration';
 * import { useQueryClient } from '@tanstack/react-query';
 *
 * function ChatApp() {
 *   const queryClient = useQueryClient();
 *
 *   useWebSocket({
 *     url: 'wss://api.example.com/ws',
 *     token: 'your-token',
 *     autoConnect: true,
 *     onMessage: (data) => {
 *       integrateWebSocketWithQueryClient(queryClient, data);
 *     },
 *   });
 *
 *   return <ChatContainer />;
 * }
 * ```
 */
export function integrateWebSocketWithQueryClient(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  switch (data.type) {
    case WebSocketMessageType.NewMessage:
      handleNewMessage(queryClient, data);
      break;

    case WebSocketMessageType.MessageStatus:
      handleMessageStatusUpdate(queryClient, data);
      break;

    case WebSocketMessageType.ConversationUpdate:
      handleConversationUpdate(queryClient, data);
      break;

    case WebSocketMessageType.ConversationListUpdate:
      handleConversationListUpdate(queryClient);
      break;

    case WebSocketMessageType.NewConversation:
      handleNewConversation(queryClient, data);
      break;

    default:
      console.warn('Unknown WebSocket message type:', data.type);
  }
}

/**
 * 获取消息内容文本
 */
function getMessageText(content: StandardMessage['content']): string {
  if ('text' in content) {
    return content.text;
  }
  return 'Media';
}

/**
 * 处理新消息
 *
 * @description
 * 使用 MessageCacheHelper 处理新消息，支持无限查询数据结构。
 * 自动去重（基于 id 和 tempId），避免重复消息。
 */
function handleNewMessage(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  if (!data.conversationId || !data.message) {
    return;
  }

  // 1. 添加新消息到消息列表缓存
  // Query Key: ['messages', 'list', conversationId]
  // 操作的是特定会话的消息列表
  MessageCacheHelper.addMessageToCache(
    queryClient,
    data.conversationId,
    data.message,
  );

  // 2. 更新会话列表中的会话信息
  // Query Key: ['conversations', 'list']
  // 操作的是会话列表，更新最后一条消息、时间戳、未读数等
  // 注意：这两个操作针对不同的缓存，不会有冲突
  queryClient.setQueryData(
    queryKeys.conversations.list(),
    (old: unknown[] | undefined) => {
      if (!old) {
        return old;
      }
      return old.map((conv: any) => {
        if (conv.id === data.conversationId) {
          return {
            ...conv,
            lastMessage: getMessageText(data.message!.content),
            lastMessageTime: new Date(data.message!.timestamp).toISOString(),
            unreadCount: (conv.unreadCount || 0) + 1,
          };
        }
        return conv;
      });
    },
  );
}

/**
 * 处理消息状态更新
 *
 * @description
 * 使用 MessageCacheHelper 更新消息状态，支持无限查询数据结构。
 * 同时支持通过 messageId 和 tempId 查找消息。
 */
function handleMessageStatusUpdate(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  if (!data.messageId || !data.conversationId || !data.status) {
    return;
  }

  // 使用 MessageCacheHelper 更新消息状态
  // 支持通过 messageId 或 tempId 查找消息
  MessageCacheHelper.updateMessageStatus(
    queryClient,
    data.conversationId,
    data.status as any,
    data.messageId,
    undefined, // tempId 如果需要可以从 data 中获取
  );
}

/**
 * 处理会话更新
 */
function handleConversationUpdate(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  if (!data.conversationId) {
    return;
  }

  // 使会话详情缓存失效，触发重新获取
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.detail(data.conversationId),
  });

  // 使会话列表缓存失效，触发重新获取
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.list(),
  });
}

/**
 * 处理会话列表更新
 */
function handleConversationListUpdate(queryClient: QueryClient): void {
  // 使会话列表缓存失效，触发重新获取
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.list(),
  });
}

/**
 * 处理新会话
 */
function handleNewConversation(
  queryClient: QueryClient,
  data: WebSocketMessageData,
): void {
  if (!data.conversationId) {
    return;
  }

  // 使会话列表缓存失效，触发重新获取
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.list(),
  });

  // 预取会话详情
  queryClient.prefetchQuery({
    queryKey: queryKeys.conversations.detail(data.conversationId),
  });
}

/**
 * 创建 WebSocket 消息处理器
 *
 * @description
 * 返回一个函数，用于处理 WebSocket 消息并更新 React Query Cache。
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 * const handleWebSocketMessage = createWebSocketMessageHandler(queryClient);
 *
 * useWebSocket({
 *   url: 'wss://api.example.com/ws',
 *   onMessage: handleWebSocketMessage,
 * });
 * ```
 */
export function createWebSocketMessageHandler(
  queryClient: QueryClient,
): (data: WebSocketMessageData) => void {
  return (data: WebSocketMessageData) => {
    integrateWebSocketWithQueryClient(queryClient, data);
  };
}

/**
 * WebSocket 连接状态
 */
export enum WebSocketStatusEnum {
  /** 连接中 */
  Connecting = 'connecting',
  /** 已连接 */
  Connected = 'connected',
  /** 断开连接 */
  Disconnected = 'disconnected',
  /** 连接错误 */
  Error = 'error',
}

/**
 * WebSocket 消息事件类型
 */
export enum WebSocketEventTypeEnum {
  /** 消息事件 */
  Message = 'message',
  /** 消息状态更新 */
  MessageStatus = 'message_status',
  /** 会话更新 */
  ConversationUpdate = 'conversation_update',
  /** 会话列表更新 */
  ConversationListUpdate = 'conversation_list_update',
  /** 心跳响应 */
  Heartbeat = 'heartbeat',
  /** 错误 */
  Error = 'error',
}

/**
 * WebSocket 事件数据
 */
export interface WebSocketEventData {
  /** 事件类型 */
  type: WebSocketEventTypeEnum;
  /** 数据 */
  data: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * WebSocket 配置
 */
export interface WebSocketConfig {
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
}

/**
 * WebSocket 事件监听器
 */
export type WebSocketEventListener = (data: WebSocketEventData) => void;

/**
 * WebSocket 状态监听器
 */
export type WebSocketStatusListener = (status: WebSocketStatusEnum) => void;

/**
 * WebSocketManager：WebSocket 连接管理器
 *
 * @description
 * 负责 WebSocket 连接的建立、维护、消息收发和事件分发。
 * 支持心跳、自动重连、状态监听等功能。
 *
 * @example
 * ```typescript
 * const manager = new WebSocketManager({
 *   url: 'wss://api.example.com/ws',
 *   token: 'your-token',
 * });
 *
 * // 监听消息
 * manager.onMessage((data) => {
 *   console.log('收到消息:', data);
 * });
 *
 * // 监听状态
 * manager.onStatusChange((status) => {
 *   console.log('连接状态:', status);
 * });
 *
 * // 连接
 * await manager.connect();
 *
 * // 发送消息
 * manager.send({ type: 'chat', content: 'Hello' });
 *
 * // 断开连接
 * manager.disconnect();
 * ```
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: WebSocketStatusEnum = WebSocketStatusEnum.Disconnected;
  private messageListeners: Set<WebSocketEventListener> = new Set();
  private statusListeners: Set<WebSocketStatusListener> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      connectionTimeout: config.connectionTimeout ?? 10000,
      autoReconnect: config.autoReconnect ?? true,
      token: config.token ?? '',
    };
  }

  /**
   * 获取当前连接状态
   */
  getStatus(): WebSocketStatusEnum {
    return this.status;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.status === WebSocketStatusEnum.Connected;
  }

  /**
   * 监听消息事件
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  onMessage(listener: WebSocketEventListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * 监听状态变化
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  onStatusChange(listener: WebSocketStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setStatus(WebSocketStatusEnum.Connecting);
      this.isManualDisconnect = false;

      try {
        // 构建 WebSocket URL（支持 Token 认证）
        const wsUrl = this.buildWebSocketUrl();
        this.ws = new WebSocket(wsUrl);

        // 连接超时处理
        this.connectionTimer = setTimeout(() => {
          if (this.status === WebSocketStatusEnum.Connecting) {
            this.handleConnectionError(new Error('Connection timeout'));
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);

        // 连接成功
        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.setStatus(WebSocketStatusEnum.Connected);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        // 接收消息
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        // 连接关闭
        this.ws.onclose = (event) => {
          this.clearConnectionTimer();
          this.stopHeartbeat();
          this.setStatus(WebSocketStatusEnum.Disconnected);

          if (!this.isManualDisconnect && this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        // 连接错误
        this.ws.onerror = (error) => {
          this.clearConnectionTimer();
          this.handleConnectionError(error);
          reject(error);
        };
      } catch (error) {
        this.handleConnectionError(error);
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.clearConnectionTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus(WebSocketStatusEnum.Disconnected);
  }

  /**
   * 发送消息
   * @param data 消息数据
   */
  send(data: unknown): void {
    if (!this.isConnected() || !this.ws) {
      throw new Error('WebSocket is not connected');
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      throw error;
    }
  }

  /**
   * 设置连接状态
   */
  private setStatus(status: WebSocketStatusEnum): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach((listener) => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // 处理心跳响应
      if (data.type === WebSocketEventTypeEnum.Heartbeat) {
        return;
      }

      // 分发消息事件
      const eventData: WebSocketEventData = {
        type: data.type || WebSocketEventTypeEnum.Message,
        data: data.data || data,
        timestamp: Date.now(),
      };

      this.messageListeners.forEach((listener) => {
        try {
          listener(eventData);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(error: unknown): void {
    console.error('WebSocket connection error:', error);
    this.setStatus(WebSocketStatusEnum.Error);

    // 触发错误事件
    this.messageListeners.forEach((listener) => {
      try {
        listener({
          type: WebSocketEventTypeEnum.Error,
          data: error,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.send({
            type: WebSocketEventTypeEnum.Heartbeat,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error(
        `Max reconnect attempts (${this.config.maxReconnectAttempts}) reached`,
      );
      return;
    }

    this.clearReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(
        `Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
      );
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 清除连接超时定时器
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * 构建 WebSocket URL
   */
  private buildWebSocketUrl(): string {
    let url = this.config.url;

    // 添加 Token（如果提供）
    if (this.config.token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
    }

    return url;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.disconnect();
    this.messageListeners.clear();
    this.statusListeners.clear();
  }
}
