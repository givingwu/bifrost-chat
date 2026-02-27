/**
 * WebSocket Manager - 改进版本
 *
 * @description
 * WebSocket 连接管理器，负责连接的建立、维护、消息收发和事件分发。
 * 支持心跳、自动重连、状态监听等功能。
 *
 * @module services/websocket-manager
 *
 * @ improvements
 * - 使用策略模式处理不同类型的消息
 * - 统一的错误处理机制
 * - 更好的类型安全
 * - 改进的代码可读性和可维护性
 * - 性能优化（缓存、批量处理等）
 * - 更好的边界条件处理
 *
 * @version 2.0.0
 */

import {
  ConfigurationError,
  ConnectionTimeoutError,
  ErrorHandler,
  ParseError,
  SendFailedError,
  ValidationError,
} from '@/interfaces/error.interface';
import {
  ClientTypeEnum,
  type StandardMessage,
} from '@/interfaces/message.interface';
import {
  type AckRawPacket,
  type HeartbeatParams,
  PacketMessageTypeEnum,
  type RawPacket,
  type ReadAckParams,
} from '@/interfaces/protocol.interface';
import {
  type AuthFailListener,
  type WebSocketConfig,
  type WebSocketEventData,
  type WebSocketEventListener,
  WebSocketEventTypeEnum,
  WebSocketStatusEnum,
  type WebSocketStatusListener,
} from '@/interfaces/websocket.interface';
import { MessageBuilder } from '@/services/message-builder.service';
import {
  AckHandler,
  HeartbeatManager,
  PacketConverter,
  PacketValidator,
} from '@/services/protocol';
import { PacketHandlerStrategy } from './packet-handler.strategy';
import {
  isValidStateTransition,
  WEBSOCKET_DEFAULT_CONFIG,
  type WebSocketStatus,
} from './websocket.constants';

/**
 * WebSocketManager：WebSocket 连接管理器（改进版）
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
  // ==================== 私有属性 ====================

  /** WebSocket 实例 */
  private ws: WebSocket | null = null;

  /** 配置（带默认值） */
  private config: Required<WebSocketConfig>;

  /** 当前连接状态 */
  private status: WebSocketStatusEnum = WebSocketStatusEnum.Disconnected;

  /** 消息事件监听器集合 */
  private messageListeners: Set<WebSocketEventListener> = new Set();

  /** 状态变化监听器集合 */
  private statusListeners: Set<WebSocketStatusListener> = new Set();

  /** 登录失败监听器集合 */
  private authFailListeners: Set<AuthFailListener> = new Set();

  /** 心跳定时器 */
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** 重连定时器 */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** 重连尝试次数 */
  private reconnectAttempts = 0;

  /** 连接超时定时器 */
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;

  /** 是否手动断开连接 */
  private isManualDisconnect = false;

  /** 数据包处理器策略 */
  private packetHandler: PacketHandlerStrategy;

  /** 类型守卫缓存 */
  private isRecordCache = new WeakMap<object, boolean>();

  // ==================== 构造函数 ====================

  /**
   * 构造函数
   *
   * @param config WebSocket 配置
   * @throws {ConfigurationError} 配置无效时抛出
   */
  constructor(config: WebSocketConfig) {
    // 验证配置
    this.validateConfig(config);

    // 合并默认配置
    this.config = {
      url: config.url,
      heartbeatInterval:
        config.heartbeatInterval ?? WEBSOCKET_DEFAULT_CONFIG.HEARTBEAT_INTERVAL,
      reconnectInterval:
        config.reconnectInterval ?? WEBSOCKET_DEFAULT_CONFIG.RECONNECT_INTERVAL,
      maxReconnectAttempts:
        config.maxReconnectAttempts ??
        WEBSOCKET_DEFAULT_CONFIG.MAX_RECONNECT_ATTEMPTS,
      connectionTimeout:
        config.connectionTimeout ?? WEBSOCKET_DEFAULT_CONFIG.CONNECTION_TIMEOUT,
      autoReconnect:
        config.autoReconnect ?? WEBSOCKET_DEFAULT_CONFIG.AUTO_RECONNECT,
      token: config.token ?? '',
      enableProtocolConversion:
        config.enableProtocolConversion ??
        WEBSOCKET_DEFAULT_CONFIG.ENABLE_PROTOCOL_CONVERSION,
      currentPin: config.currentPin ?? '',
      fromApp: config.fromApp ?? '',
      fromPin: config.fromPin ?? '',
    };

    // 初始化数据包处理器（传递自身以支持 ACK 自动发送）
    this.packetHandler = new PacketHandlerStrategy(this);
  }

  // ==================== 公共方法 ====================

  /**
   * 获取当前连接状态
   *
   * @returns 当前连接状态
   */
  getStatus(): WebSocketStatusEnum {
    return this.status;
  }

  /**
   * 是否已连接
   *
   * @returns 是否已连接
   */
  isConnected(): boolean {
    return this.status === WebSocketStatusEnum.Connected;
  }

  /**
   * 监听消息事件
   *
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
   *
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
   * 监听登录失败事件
   *
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  onAuthFail(listener: AuthFailListener): () => void {
    this.authFailListeners.add(listener);

    return () => {
      this.authFailListeners.delete(listener);
    };
  }

  /**
   * 连接 WebSocket
   *
   * @returns Promise，连接成功时 resolve
   * @throws {ConnectionTimeoutError} 连接超时
   * @throws {ConnectionFailedError} 连接失败
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果已经连接，直接返回
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      // 检查状态转换是否合法
      if (
        !isValidStateTransition(
          this.status as WebSocketStatus,
          'connecting' as WebSocketStatus,
        )
      ) {
        reject(
          new ConfigurationError(
            `Invalid state transition from ${this.status} to connecting`,
          ),
        );
        return;
      }

      this.setStatus(WebSocketStatusEnum.Connecting);
      this.isManualDisconnect = false;

      try {
        // 构建 WebSocket URL（支持 Token 认证）
        this.ws = new WebSocket(this.config.url);

        // 连接超时处理
        this.connectionTimer = setTimeout(() => {
          if (this.status === WebSocketStatusEnum.Connecting) {
            const error = new ConnectionTimeoutError({
              url: this.config.url,
              timeout: this.config.connectionTimeout,
            });
            this.handleConnectionError(error);
            reject(error);
          }
        }, this.config.connectionTimeout);

        // 连接成功
        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.setStatus(WebSocketStatusEnum.Connected);
          this.reconnectAttempts = 0;

          // 连接成功后自动发送鉴权消息
          try {
            this.sendAuth();
          } catch (error) {
            console.error('Failed to send auth:', error);
          }

          this.startHeartbeat();
          resolve();
        };

        // 接收消息
        this.ws.onmessage = (event) => {
          this.handleMessage(event).catch((error) => {
            console.error('Error handling message:', error);
          });
        };

        // 连接关闭
        this.ws.onclose = (_event) => {
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
      // fix: 兼容 test 场景的 close
      this.ws.close?.();
      this.ws = null;
    }

    this.setStatus(WebSocketStatusEnum.Disconnected);
  }

  /**
   * 发送消息
   *
   * @param data 消息数据
   * @throws {SendFailedError} 发送失败
   * @throws {ValidationError} 数据格式验证失败
   */
  send(data: unknown): void {
    if (!this.isConnected() || !this.ws) {
      throw new SendFailedError('WebSocket is not connected');
    }

    // 验证发送数据包格式（如果启用了协议转换）
    if (this.config.enableProtocolConversion) {
      try {
        PacketValidator.ensurePType(data);
      } catch (error) {
        const validationError = new ValidationError('Invalid packet format', {
          originalError: error,
        });
        console.error('Invalid packet format:', error);
        throw validationError;
      }
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      const sendError = new SendFailedError(
        error instanceof Error ? error.message : String(error),
        { originalError: error },
      );
      console.error('Failed to send WebSocket message:', error);
      throw sendError;
    }
  }

  /**
   * 发送标准消息（内部自动转换为 RawPacket）
   *
   * @param message 标准消息
   * @param extraFields 额外字段
   * @throws {ConfigurationError} 配置缺失
   * @throws {SendFailedError} 发送失败
   */
  sendStandardMessage(
    message: StandardMessage,
    extraFields?: Partial<RawPacket>,
  ): void {
    const { fromApp, fromPin } = this.config;

    if (!fromApp || !fromPin) {
      throw new ConfigurationError(
        'fromApp/fromPin is required for protocol message sending',
      );
    }

    const packet = PacketConverter.toRawPacket(message, fromApp, fromPin);
    this.send({
      ...packet,
      ...(extraFields ?? {}),
    });
  }

  /**
   * 发送已读 ACK
   *
   * @description
   * 发送上行已读 ACK 消息，ptype 为 `msg_read_ack`
   *
   * @param params 已读 ACK 参数
   * @throws {SendFailedError} 发送失败
   */
  sendReadAck(params: ReadAckParams): void {
    const packet = AckHandler.createReadAck(params);
    this.send(packet);
  }

  /**
   * 发送收到消息 ACK
   *
   * @description
   * 发送上行收到消息 ACK 消息，ptype 为 `msg_receive_ack`
   *
   * @param params 收到 ACK 参数
   * @throws {SendFailedError} 发送失败
   */
  sendReceiveAck(params: ReadAckParams): void {
    const packet = AckHandler.createReceiveAck(params);
    this.send(packet);
  }

  /**
   * 发送心跳包（业务协议）
   *
   * @param params 心跳参数
   * @throws {SendFailedError} 发送失败
   */
  sendProtocolHeartbeat(params: HeartbeatParams): void {
    const packet = HeartbeatManager.createHeartbeat(params);
    this.send(packet);
  }

  /**
   * 发送登录鉴权消息
   *
   * @description
   * 连接成功后需先发送 auth 消息进行登录鉴权
   *
   * @throws {ConfigurationError} 配置缺失
   * @throws {SendFailedError} 发送失败
   */
  sendAuth(): void {
    const { fromApp, fromPin, token } = this.config;
    const authPacket: RawPacket = {
      id: MessageBuilder.generateUniqueId(),
      from: {
        app: fromApp,
        pin: fromPin,
        clientType: ClientTypeEnum.Web,
      },
      to: {
        app: fromApp,
        pin: fromPin,
      },
      ptype: PacketMessageTypeEnum.Auth,
      body: {
        token,
      },
      ver: '1.0',
      timestamp: Date.now(),
    };

    this.send(authPacket);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.disconnect();
    this.messageListeners.clear();
    this.statusListeners.clear();
    this.authFailListeners.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 设置连接状态
   *
   * @param status 新状态
   */
  private setStatus(status: WebSocketStatusEnum): void {
    if (this.status === status) {
      return;
    }

    // 验证状态转换
    if (
      !isValidStateTransition(
        this.status as WebSocketStatus,
        status as WebSocketStatus,
      )
    ) {
      console.warn(`Invalid state transition: ${this.status} -> ${status}`);
      return;
    }

    this.status = status;
    this.notifyStatusListeners(status);
  }

  /**
   * 通知状态监听器
   *
   * @param status 状态
   */
  private notifyStatusListeners(status: WebSocketStatusEnum): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * 处理接收到的消息
   *
   * @param event 消息事件
   * @throws {ParseError} 解析失败
   */
  private async handleMessage(event: MessageEvent<string>): Promise<void> {
    try {
      const data: RawPacket | AckRawPacket = JSON.parse(event.data);

      // 验证数据包格式（如果启用了协议转换）
      if (this.config.enableProtocolConversion) {
        if (!PacketValidator.hasValidPtype(data)) {
          const error = new ValidationError(
            'Invalid packet: missing or invalid ptype field',
            { data },
          );

          console.error(error.message, data);
          this.notifyError(error);
          return;
        }

        // 使用策略模式处理协议事件
        const protocolEvent = this.packetHandler.handle({
          packet: data,
          currentPin: this.config.currentPin,
        });

        if (protocolEvent) {
          // 特殊处理登录失败事件
          if (protocolEvent.type === WebSocketEventTypeEnum.AuthFail) {
            this.notifyAuthFailListeners(protocolEvent.data);
          }

          this.notifyMessageListeners(protocolEvent);
          return;
        }
      }

      // 处理心跳响应（静默处理）
      if (
        this.isRecord(data) &&
        typeof data === 'object' &&
        'type' in data &&
        data.type === WebSocketEventTypeEnum.Heartbeat
      ) {
        return;
      }

      // 分发消息事件（兜底逻辑）
      const eventData: WebSocketEventData = {
        type:
          this.isRecord(data) && typeof data === 'object' && 'type' in data
            ? (data.type as WebSocketEventTypeEnum)
            : WebSocketEventTypeEnum.Message,
        data: this.isRecord(data) && 'data' in data ? data.data : data,
        timestamp: Date.now(),
      };

      this.notifyMessageListeners(eventData);
    } catch (error) {
      const parseError = new ParseError(error, { originalData: event.data });
      console.error('Failed to parse WebSocket message:', error);
      this.notifyError(parseError);
    }
  }

  /**
   * 通知消息监听器
   *
   * @param eventData 事件数据
   */
  private notifyMessageListeners(eventData: WebSocketEventData): void {
    // 使用 Array.from 避免在迭代时修改 Set
    const listeners = Array.from(this.messageListeners);

    for (const listener of listeners) {
      try {
        listener(eventData);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    }
  }

  /**
   * 通知错误事件
   *
   * @param error 错误信息
   */
  private notifyError(error: Error): void {
    const eventData: WebSocketEventData = {
      type: WebSocketEventTypeEnum.Error,
      data: ErrorHandler.formatForLogging(error),
      timestamp: Date.now(),
    };

    this.notifyMessageListeners(eventData);
  }

  /**
   * 通知登录失败监听器
   *
   * @param error 错误数据
   */
  private notifyAuthFailListeners(error: unknown): void {
    const listeners = Array.from(this.authFailListeners);

    for (const listener of listeners) {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in auth fail listener:', err);
      }
    }
  }

  /**
   * 处理连接错误
   *
   * @param error 错误信息
   */
  private handleConnectionError(error: unknown): void {
    console.error('WebSocket connection error:', error);
    this.setStatus(WebSocketStatusEnum.Error);

    // 触发错误事件
    this.notifyError(
      ErrorHandler.fromUnknown(
        error instanceof Error ? error : new Error(String(error)),
      ),
    );
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendHeartbeat().catch((error) => {
          console.error('Failed to send heartbeat:', error);
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 发送心跳消息
   *
   * @throws {ConfigurationError} 配置缺失
   * @throws {SendFailedError} 发送失败
   */
  private async sendHeartbeat(): Promise<void> {
    const { fromApp, fromPin } = this.config;

    if (!fromApp || !fromPin) {
      throw new ConfigurationError(
        'Cannot send heartbeat: missing fromApp/fromPin',
      );
    }

    const heartbeat = HeartbeatManager.createHeartbeat({
      fromApp,
      fromPin,
      toApp: fromApp,
      toPin: fromPin,
    });

    // 验证心跳消息格式
    if (!HeartbeatManager.isValidHeartbeat(heartbeat)) {
      console.error('Invalid heartbeat message', heartbeat);
      return;
    }

    this.send(heartbeat);
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
   * 类型守卫：判断是否为 Record 类型（带缓存）
   *
   * @param value 待判断的值
   * @returns 是否为 Record 类型
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    // 使用缓存避免重复检查
    if (this.isRecordCache.has(value)) {
      return this.isRecordCache.get(value) as boolean;
    }

    const result = true;
    this.isRecordCache.set(value, result);
    return result;
  }

  /**
   * 验证配置
   *
   * @param config 配置对象
   * @throws {ConfigurationError} 配置无效时抛出
   */
  private validateConfig(config: WebSocketConfig): void {
    if (!config.url) {
      throw new ConfigurationError('WebSocket URL is required');
    }

    try {
      new URL(config.url);
    } catch {
      throw new ConfigurationError(`Invalid WebSocket URL: ${config.url}`);
    }
  }
}
