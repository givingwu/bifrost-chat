import type { StandardMessage } from '@/interfaces/message.interface';
import type {
  HeartbeatParams,
  RawPacket,
  ReadAckParams,
} from '@/interfaces/protocol.interface';
import {
  AckTypeEnum,
  PacketMessageTypeEnum,
} from '@/interfaces/protocol.interface';
import { AckHandler, PacketConverter } from '@/services/protocol';
import { HeartbeatManager } from '@/services/protocol/heartbeat.manager';
import { MessageBuilder } from './message-builder.service';

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
  /** 登录失败 */
  AuthFail = 'auth_fail',
  /** 状态切换 */
  StatusSwitch = 'status_switch',
  /** 触达回复消息发送结果 */
  FoxMessageAck = 'fox_message_ack',
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
  /** 是否启用协议转换 */
  enableProtocolConversion?: boolean;
  /** 当前用户 pin（用于方向判断） */
  currentPin?: string;
  /** 默认发送方 app（协议发送辅助） */
  fromApp?: string;
  /** 默认发送方 pin（协议发送辅助） */
  fromPin?: string;
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
/**
 * 登录失败回调
 */
export type AuthFailListener = (error: unknown) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: WebSocketStatusEnum = WebSocketStatusEnum.Disconnected;
  private messageListeners: Set<WebSocketEventListener> = new Set();
  private statusListeners: Set<WebSocketStatusListener> = new Set();
  private authFailListeners: Set<AuthFailListener> = new Set();
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
      enableProtocolConversion: config.enableProtocolConversion ?? true,
      currentPin: config.currentPin ?? '',
      fromApp: config.fromApp ?? '',
      fromPin: config.fromPin ?? '',
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
   * 监听登录失败事件
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
        this.ws = new WebSocket(this.config.url);

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
          // 连接成功后自动发送鉴权消息
          this.sendAuth();
          this.startHeartbeat();

          resolve();
        };

        // 接收消息
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
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
   * 发送标准消息（内部自动转换为 RawPacket）
   */
  sendStandardMessage(
    message: StandardMessage,
    extraFields?: Partial<RawPacket>,
  ): void {
    const fromApp = this.config.fromApp;
    const fromPin = this.config.fromPin;

    if (!fromApp || !fromPin) {
      throw new Error(
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
   */
  sendReadAck(params: ReadAckParams): void {
    const packet = AckHandler.createReadAck(params);
    this.send(packet);
  }

  /**
   * 发送心跳包（业务协议）
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
   */
  sendAuth(): void {
    const { fromApp, fromPin, token } = this.config;

    if (!fromApp || !fromPin || !token) {
      throw new Error('fromApp/fromPin/token is required for authentication');
    }

    const authPacket: RawPacket = {
      id: MessageBuilder.generateUniqueId(),
      from: {
        app: fromApp,
        pin: fromPin,
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
      const data: unknown = JSON.parse(event.data);

      if (this.config.enableProtocolConversion) {
        const protocolEvent = this.convertProtocolEvent(data);

        if (protocolEvent) {
          this.messageListeners.forEach((listener) => {
            try {
              listener(protocolEvent);
            } catch (error) {
              console.error('Error in message listener:', error);
            }
          });
          return;
        }
      }

      // 处理心跳响应
      if (
        this.isRecord(data) &&
        data.type === WebSocketEventTypeEnum.Heartbeat
      ) {
        return;
      }

      // 分发消息事件
      const eventData: WebSocketEventData = {
        type:
          this.isRecord(data) && typeof data.type === 'string'
            ? (data.type as WebSocketEventTypeEnum)
            : WebSocketEventTypeEnum.Message,
        data: this.isRecord(data) && 'data' in data ? data.data : data,
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
   * 转换协议事件
   *
   * @description
   * 消息处理顺序（按优先级）：
   * 1. auth_fail - 登录失败，触发失败回调并重置状态
   * 2. chat_message - 聊天消息
   * 3. ack - ACK
   * 4. msg_receive_ack - 客户端已收
   * 5. msg_read_ack - 客户端已读
   * 6. client_heartbeat - 心跳
   * 7. status_switch - 状态切换
   * 8. fox_message_ack - 触达回复消息发送结果
   */
  private convertProtocolEvent(data: unknown): WebSocketEventData | null {
    if (!this.isRecord(data)) {
      return null;
    }

    const normalized = this.normalizeAckPacket(data);

    // 获取消息类型
    const packetType =
      typeof normalized.ptype === 'string'
        ? normalized.ptype
        : typeof normalized.type === 'string'
          ? normalized.type
          : '';

    // 1. 处理登录失败 (auth_fail)
    if (
      packetType === PacketMessageTypeEnum.AuthFail ||
      packetType === 'auth_fail'
    ) {
      // 触发登录失败回调
      this.authFailListeners.forEach((listener) => {
        try {
          listener(normalized.body);
        } catch (error) {
          console.error('Error in auth fail listener:', error);
        }
      });
      return {
        type: WebSocketEventTypeEnum.AuthFail,
        data: normalized.body,
        timestamp: Date.now(),
      };
    }

    // 处理心跳响应（忽略，不分发）
    if (HeartbeatManager.isHeartbeatResponse(normalized)) {
      return null;
    }

    // 2. 处理聊天消息 (chat_message)
    if (
      packetType === PacketMessageTypeEnum.ChatMessage ||
      packetType === 'chat_message'
    ) {
      const packet = this.normalizeToRawPacket(normalized);
      const message = PacketConverter.toStandardMessage(
        packet,
        undefined,
        this.config.currentPin || undefined,
      );

      return {
        type: WebSocketEventTypeEnum.Message,
        data: {
          conversationId: packet.chatId ?? message.receiver?.pin ?? '',
          message,
        },
        timestamp: Date.now(),
      };
    }

    // 解析 ACK 数据
    const ackData = AckHandler.parseDownstream(normalized);

    if (ackData) {
      const ackType = ackData.body.type;

      // 3. 处理普通 ACK
      if (ackType === AckTypeEnum.MsgSendFailed) {
        // 发送失败也通过 MessageStatus 传递
        return {
          type: WebSocketEventTypeEnum.MessageStatus,
          data: {
            conversationId:
              typeof normalized.chatId === 'string' ? normalized.chatId : '',
            messageId: ackData.id,
            status: AckHandler.ackTypeToMessageStatus(ackType),
            timestamp: ackData.timestamp ?? Date.now(),
          },
          timestamp: Date.now(),
        };
      }

      // 4. 处理客户端已收 (msg_receive_ack)
      if (ackType === AckTypeEnum.MsgReceiveAck) {
        return {
          type: WebSocketEventTypeEnum.MessageStatus,
          data: {
            conversationId:
              typeof normalized.chatId === 'string' ? normalized.chatId : '',
            messageId: ackData.id,
            status: AckHandler.ackTypeToMessageStatus(ackType),
            timestamp: ackData.timestamp ?? Date.now(),
          },
          timestamp: Date.now(),
        };
      }

      // 5. 处理客户端已读 (msg_read_ack)
      if (ackType === AckTypeEnum.MsgReadAck) {
        return {
          type: WebSocketEventTypeEnum.MessageStatus,
          data: {
            conversationId:
              typeof normalized.chatId === 'string' ? normalized.chatId : '',
            messageId: ackData.id,
            status: AckHandler.ackTypeToMessageStatus(ackType),
            timestamp: ackData.timestamp ?? Date.now(),
          },
          timestamp: Date.now(),
        };
      }

      // 6. 处理心跳 ACK (client_heartbeat)
      if (ackType === AckTypeEnum.ClientHeartbeat) {
        // 心跳 ACK 不需要分发到上层，静默处理
        return null;
      }

      // 其他 ACK 类型统一处理
      return {
        type: WebSocketEventTypeEnum.MessageStatus,
        data: {
          conversationId:
            typeof normalized.chatId === 'string' ? normalized.chatId : '',
          messageId: ackData.id,
          status: AckHandler.ackTypeToMessageStatus(ackType),
          timestamp: ackData.timestamp ?? Date.now(),
        },
        timestamp: Date.now(),
      };
    }

    // 7. 处理状态切换 (status_switch)
    if (
      packetType === PacketMessageTypeEnum.StatusSwitch ||
      packetType === 'status_switch'
    ) {
      return {
        type: WebSocketEventTypeEnum.StatusSwitch,
        data: normalized.body,
        timestamp: Date.now(),
      };
    }

    // 8. 处理触达回复消息发送结果 (fox_message_ack)
    if (
      packetType === PacketMessageTypeEnum.FoxMessageAck ||
      packetType === 'fox_message_ack'
    ) {
      return {
        type: WebSocketEventTypeEnum.FoxMessageAck,
        data: normalized.body,
        timestamp: Date.now(),
      };
    }

    // 未匹配的消息类型，返回 null 让上层处理
    return null;
  }

  private normalizeToRawPacket(data: Record<string, unknown>): RawPacket {
    const from = this.isRecord(data.from) ? data.from : {};
    const to = this.isRecord(data.to) ? data.to : {};

    return {
      id: typeof data.id === 'string' ? data.id : '',
      mid: typeof data.mid === 'string' ? data.mid : undefined,
      from: {
        app: typeof from.app === 'string' ? from.app : '',
        pin: typeof from.pin === 'string' ? from.pin : '',
        clientType: typeof from.clientType === 'string' ? from.clientType : '',
        channelType:
          typeof from.channelType === 'string' ? from.channelType : '',
      },
      to: {
        app: typeof to.app === 'string' ? to.app : '',
        pin: typeof to.pin === 'string' ? to.pin : '',
        clientType: typeof to.clientType === 'string' ? to.clientType : '',
        channelType: typeof to.channelType === 'string' ? to.channelType : '',
      },
      ptype:
        typeof data.ptype === 'string'
          ? data.ptype
          : typeof data.type === 'string'
            ? data.type
            : 'chat_message',
      body: this.isRecord(data.body) ? data.body : {},
      ver: typeof data.ver === 'string' ? data.ver : '1.0',
      timestamp:
        typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      chatId: typeof data.chatId === 'string' ? data.chatId : undefined,
      entry: typeof data.entry === 'string' ? data.entry : undefined,
    };
  }

  private normalizeAckPacket(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (data.type === 'ack') {
      return data;
    }

    if (data.ptype === 'ack') {
      return {
        ...data,
        type: 'ack',
      };
    }

    return data;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
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
   * 清理资源
   */
  destroy(): void {
    this.disconnect();
    this.messageListeners.clear();
    this.statusListeners.clear();
    this.authFailListeners.clear();
  }
}
