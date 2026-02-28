/**
 * 数据包处理器类型定义
 *
 * @description
 * 定义数据包处理器共享的类型和接口
 *
 * @module services/websocket/handlers
 */

import type { AckRawPacket, RawPacket } from '@/interfaces/protocol.interface';
import type { StandardMessage } from './message.interface';

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
 * WebSocket 连接状态枚举
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
 * WebSocket 配置接口
 */
export interface WebSocketConfig {
  /** WebSocket 服务器 URL */
  url: string;
  /** 认证 Token */
  token: string;
  /** 默认发送方 app（协议发送辅助） */
  fromApp: string;
  /** 默认发送方 pin（协议发送辅助） */
  fromPin: string;
  /** 当前用户 pin（用于方向判断） */
  currentPin: string;
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
  /** 是否启用协议转换 */
  enableProtocolConversion?: boolean;
}

/**
 * WebSocket 事件监听器类型
 */
export type WebSocketEventListener = (data: WebSocketEventData) => void;

/**
 * WebSocket 状态监听器类型
 */
export type WebSocketStatusListener = (status: WebSocketStatusEnum) => void;

/**
 * 登录失败回调类型
 */
export type AuthFailListener = (error: unknown) => void;

/**
 * 数据包处理器结果
 */
export interface PacketHandlerResult {
  /** 事件数据 */
  eventData: WebSocketEventData | null;
  /** 是否应该继续处理 */
  shouldContinue: boolean;
}

/**
 * 数据包处理器上下文
 */
export interface PacketHandlerContext {
  /** 当前用户 PIN（用于方向判断） */
  currentPin?: string;
  /** 数据包 */
  packet: RawPacket | AckRawPacket;
}

/**
 * 基础数据包处理器
 *
 * @description
 * 定义所有数据包处理器的抽象基类，提供通用的辅助方法
 *
 * @module services/websocket/handlers
 */

/**
 * 抽象数据包处理器
 *
 * @description
 * 所有具体处理器都必须继承此类并实现 `canHandle` 和 `handle` 方法
 */
export abstract class BasePacketHandler {
  /**
   * 判断是否可以处理该数据包
   *
   * @param packetType 数据包类型
   * @returns 是否可以处理
   */
  abstract canHandle(packetType: string): boolean;

  /**
   * 处理数据包
   *
   * @param context 处理器上下文
   * @returns 处理结果
   */
  abstract handle(context: PacketHandlerContext): PacketHandlerResult;

  /**
   * 提取会话 ID
   *
   * @param packet 数据包
   * @returns 会话 ID（如果不存在则返回空字符串）
   */
  protected extractChatId(packet: RawPacket | AckRawPacket): string {
    return packet.chatId;
  }

  /**
   * 提取时间戳
   *
   * @param packet 数据包
   * @returns 时间戳
   */
  protected extractTimestamp(packet: RawPacket | AckRawPacket): number {
    return packet.timestamp ?? Date.now();
  }

  /**
   * 创建事件数据
   *
   * @param type 事件类型
   * @param data 事件数据
   * @returns WebSocket 事件数据
   */
  protected createEventData(
    type: WebSocketEventTypeEnum,
    data: unknown,
  ): WebSocketEventData {
    return {
      type,
      data,
      timestamp: Date.now(),
    };
  }
}
