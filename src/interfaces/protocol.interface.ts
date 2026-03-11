import type { ServerMessageStatus } from '@/services/protocol/status.mapper';
import type {
  IAuthMessage,
  ILocationMessage,
  IMediaMessage,
  IRichMediaMessage,
  IStringMessage,
  ITemplateMessage,
  MessageParticipant,
  MessageTypeEnum,
} from './message.interface';

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
  /** ACK 确认（下行协议，旧格式） */
  Ack = 'ack',
  /** 心跳 */
  ClientHeartbeat = 'client_heartbeat',
  /** 状态切换 */
  StatusSwitch = 'status_switch',
  /** 触达回复消息发送结果 */
  FoxMessageAck = 'fox_message_ack',
  /** 删除会话指令 */
  DeleteChat = 'delete_chat',
  /**
   * 消息状态更新（下行协议，新格式）
   *
   * @description
   * 服务端推送消息状态变化时使用，body 包含 id / chatId / status / errorInfo 等字段。
   * 与旧 ptype=ack 并存，不做替换。
   */
  MessageStatusAck = 'message_status_ack',
}

/**
 * Packet 协议消息体（body）结构，用于类型安全的 Packet body 转换
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
export type PacketBody =
  | TextPacketBody
  | MediaPacketBody
  | TemplatePacketBody
  | LocationPacketBody
  | RichMediaPacketBody
  | AuthPacketBody
  | StatusSwitchBody
  | DeleteChatBody
  | PacketBodyBase;

export interface AuthPacketBody extends IAuthMessage {}

export interface PacketBodyBase {
  type?: MessageTypeEnum | PacketMessageTypeEnum | AckMessageTypeEnum;
  content?: unknown;
  ext?: Record<string, unknown>;
}

export interface TextPacketBody extends PacketBodyBase {
  type: MessageTypeEnum.Text;
  content: IStringMessage;
}

export interface MediaPacketBody extends PacketBodyBase {
  type:
    | MessageTypeEnum.Image
    | MessageTypeEnum.Audio
    | MessageTypeEnum.Video
    | MessageTypeEnum.File;
  content: IMediaMessage;
}

export interface TemplatePacketBody extends PacketBodyBase {
  type: MessageTypeEnum.Template;
  content: ITemplateMessage;
}

export interface LocationPacketBody extends PacketBodyBase {
  type: MessageTypeEnum.Location;
  content: ILocationMessage;
}

export interface RichMediaPacketBody extends PacketBodyBase {
  type: MessageTypeEnum.RichMedia;
  content: IRichMediaMessage;
}

/**
 * Packet 协议原始消息格式，基础 Packet 接口（不包含 body）
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
export interface BaseRawPacket {
  /** 消息 ID（发起方生成 uuid） */
  id: string;
  /**
   * 消息服务端 id（投递服务生成）
   *  - 客户端发送是没有的
   *  - 服务端返回时一定有
   */
  mid?: string;
  /** 上一条消息 id，不一定有，视业务逻辑情况而定 */
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
   * - `delete_chat` - 删除会话指令
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
  ptype: PacketMessageTypeEnum | AckMessageTypeEnum;
  /** 协议版本，目前默认是 1.0.0 */
  ver: string;
  /** 服务端生成时间戳 */
  timestamp: number;
  /**
   * 该字段暂未使用，SDK 入口(枚举)：
   *  - fox.system, fox.collect 电催详情
   *  - fox.telesales 电销
   */
  entry?: string;
  /** 会话 ID（chat_message 类型必填） */
  chatId: string;
  /** 消息状态（见 MessageStatus） */
  status?: ServerMessageStatus;
}

/**
 * 普通 Packet（聊天消息、心跳等）
 */
export interface RawPacket extends BaseRawPacket {
  /** 消息内容 */
  body: PacketBody;
}

/**
 * ACK Packet（ACK 确认消息）
 */
export interface AckRawPacket extends BaseRawPacket {
  /** ACK 消息类型 */
  ptype: PacketMessageTypeEnum.Ack | AckMessageTypeEnum;
  /** ACK 消息内容 */
  body: AckPacketBody;
}

/**
 * ACK 消息体
 * 用于 ACK 协议的专用消息体
 */
export interface AckPacketBody {
  /** 发送者 PIN */
  sender: string;
  /** 应用 ID */
  app: string;
  /** 消息 ID */
  mid: string;
  /** 会话 ID */
  chatId: string;
  /** 消息时间戳 */
  timestamp: number;
}

/**
 * 类型守卫：判断 Packet body 是否为可安全访问属性的普通对象
 */
export function isPacketBodyRecord(
  body: unknown,
): body is PacketBodyBase & Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
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

/**
 * 坐席状态切换 Body 结构
 * 对应文档: specs/bifrost-client-integration-guide.md 3.5.8
 */
export interface StatusSwitchBody {
  /** 目标状态: offline/ready/rest/busy/hang_up */
  status: string;
  /** 扩展信息（JSON 字符串） */
  ext?: string;
}

/**
 * 删除会话 Body 结构
 * 对应文档: specs/bifrost-client-integration-guide.md 4.12
 */
export interface DeleteChatBody {
  /** 会话 ID */
  chatId: string;
}
