import type { MessageParticipant } from './message.interface';

/**
 * ACK 类型枚举
 *
 * @description
 * 用于上行 ACK 消息的 ptype 和下行 ACK 消息的 body.type
 *
 * 上行 ACK（客户端 → 服务端）：
 * - msg_receive_ack - 收到消息 ACK
 * - msg_read_ack - 已读消息 ACK
 *
 * 下行 ACK（服务端 → 客户端）：
 * - msg_receive_ack - 收到消息 ACK 确认
 * - msg_read_ack - 已读消息 ACK 确认
 * - msg_send_failed - 消息发送失败 ACK
 */
export enum AckMessageTypeEnum {
  /** 收到消息 ACK */
  MsgReceiveAck = 'msg_receive_ack',
  /** 已读消息 ACK */
  MsgReadAck = 'msg_read_ack',
  /** 消息发送失败 ACK（仅下行） */
  MsgSendFailed = 'msg_send_failed',
}

/**
 * Packet 协议消息类型枚举
 *
 * @description
 * 用于标识协议层面的消息类型，所有 socket 通信协议必须包含此字段。
 *
 * 可选值：
 * - `auth` - 登录鉴权
 * - `auth_fail` - 登录失败
 * - `chat_message` - 聊天消息
 * - `ack` - ACK 确认（下行协议）
 * - `client_heartbeat` - 心跳
 * - `status_switch` - 状态切换
 * - `fox_message_ack` - 触达回复消息发送结果
 *
 * @note
 * 上行 ACK 消息使用 `AckMessageTypeEnum` 中的值作为 ptype：
 * - `msg_receive_ack` - 收到消息 ACK
 * - `msg_read_ack` - 已读消息 ACK
 */
export enum PacketMessageTypeEnum {
  /** 登录 */
  Auth = 'auth',
  /** 登录失败 */
  AuthFail = 'auth_fail',
  /** 聊天消息 */
  ChatMessage = 'chat_message',
  /** ACK 确认（下行协议） */
  Ack = 'ack',
  /** 心跳 */
  ClientHeartbeat = 'client_heartbeat',
  /** 状态切换 */
  StatusSwitch = 'status_switch',
  /** 触达回复消息发送结果 */
  FoxMessageAck = 'fox_message_ack',
}

/**
 * Ack 协议枚举
 */
export enum AckMessageStatusEnum {
  /** 客户端已收 */
  MsgReceiveAck = 'msg_receive_ack',
  /** 客户端已读 */
  MsgReadAck = 'msg_read_ack',
}

/**
 * Packet 协议消息体（body）结构
 *
 * @description
 * body 字段包含消息的具体内容，格式如下：
 * - type: 消息类型（text/image/audio/video/file/template/location/rich_media）
 * - content: 消息内容（根据 type 不同而不同）
 *
 * @example
 * 文本消息：
 * { type: 'text', content: '你好' }
 *
 * 图片消息：
 * { type: 'image', content: { url: 'https://example.com/image.jpg', mimeType: 'image/jpeg' } }
 *
 * 模板消息：
 * { type: 'template', content: { templateId: 'tpl_001', params: { name: '张三' } } }
 */
export type PacketBody = Record<string, unknown>;

/**
 * Packet 协议原始消息格式
 *
 * @description
 * 对应 specs/Packet包协议.md 中的 Packet 包协议定义
 *
 * @example
 * ```typescript
 * const rawPacket: RawPacket = {
 *   id: 'msg-123',
 *   mid: 'server-msg-456',
 *   from: { app: 'fox_collect.waiter', pin: 'agent-123' },
 *   to: { app: 'fox_collect.customer', pin: 'customer-001' },
 *   ptype: 'chat_message',
 *   body: { type: 'text', content: '你好' },
 *   ver: '1.0',
 *   timestamp: 1234567890000,
 *   entry: 'fox.collect',
 *   chatId: 'chat-789',
 * };
 * ```
 */
export interface RawPacket {
  /** 消息 ID（发起方生成 uuid） */
  id: string;
  /** 消息服务端 id（投递服务生成） */
  mid?: string;
  /** 上一条消息 id */
  upid?: string;
  /** 发送人信息 */
  from: MessageParticipant;
  /** 接收人信息 */
  to: MessageParticipant;
  /**
   * 【必填】协议消息类型（packet type）
   *
   * @description
   * 用于标识协议层面的消息类型，所有 socket 通信协议必须包含此字段。
   *
   * 可选值：
   * - `auth` - 登录鉴权
   * - `auth_fail` - 登录失败
   * - `chat_message` - 聊天消息
   * - `ack` - ACK 确认（下行协议）
   * - `msg_receive_ack` - 收到消息 ACK（上行协议）
   * - `msg_read_ack` - 已读消息 ACK（上行协议）
   * - `client_heartbeat` - 心跳
   * - `status_switch` - 状态切换
   *
   * @example
   * ```typescript
   * // 上行 ACK 消息
   * ptype: 'msg_read_ack' // 已读消息 ACK
   * ptype: 'msg_receive_ack' // 收到消息 ACK
   *
   * // 下行 ACK 消息
   * ptype: 'ack' // ACK 确认
   *
   * // 其他消息类型
   * ptype: 'chat_message' // 聊天消息
   * ptype: 'client_heartbeat' // 心跳
   * ```
   *
   * @see PacketMessageTypeEnum
   * @see AckMessageTypeEnum
   */
  ptype: string;
  /** 消息内容 */
  body: PacketBody;
  /** 协议版本 */
  ver: string;
  /** 服务端生成时间戳 */
  timestamp: number;
  /**
   * SDK 入口(枚举)：
   *  - fox.system, fox.collect 电催详情
   *  - fox.telesales 电销
   */
  entry?: string;
  /** 会话 ID */
  chatId?: string;
}

/**
 * ACK 协议参数
 *
 * @description
 * 创建已读 ACK 消息所需的参数
 */
export interface ReadAckParams {
  /** 发送者 PIN（通常是当前用户） */
  sender: string;
  /** 应用 ID */
  app: string;
  /** 消息 ID（要确认已读的消息 ID） */
  messageId: string;
  /** 会话 ID */
  sessionId: string;
  /** 消息时间戳 */
  datetime: number;
  /** 接收方应用 ID */
  toApp: string;
  /** 接收方 PIN */
  toPin: string;
}

/**
 * 心跳协议参数
 *
 * @description
 * 创建心跳消息所需的参数
 */
export interface HeartbeatParams {
  /** 发送方应用 ID */
  fromApp: string;
  /** 发送方 PIN */
  fromPin: string;
  /** 接收方应用 ID */
  toApp: string;
  /** 接收方 PIN */
  toPin: string;
}
