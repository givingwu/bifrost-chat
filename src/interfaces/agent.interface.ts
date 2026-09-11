import type { User } from './conversation.interface';

/**
 * Agent 状态枚举
 * 对应文档: specs/bifrost-client-integration-guide.md 3.4.5
 *
 * 服务端状态映射:
 * - offline → Offline
 * - ready → Online
 * - rest → Away
 * - busy → Busy
 * - hang_up → HangUp
 */
export enum AgentStatusEnum {
  /** 在线（对应服务端 ready） */
  Online = 'online',
  /** 离线 */
  Offline = 'offline',
  /** 通话中 */
  InCall = 'in_call',
  /** 忙碌 */
  Busy = 'busy',
  /** 离开（对应服务端 rest） */
  Away = 'away',
  /** 请勿打扰 */
  DoNotDisturb = 'do_not_disturb',
  /** 挂起 */
  HangUp = 'hang_up',
}

/**
 * Agent 能力枚举
 */
export enum AgentCapabilityEnum {
  /** 发送文本消息 */
  SendText = 'send_text',
  /** 发送媒体消息 */
  SendMedia = 'send_media',
  /** 发送模板消息 */
  SendTemplate = 'send_template',
  /** 发起语音通话 */
  VoiceCall = 'voice_call',
  /** 发起视频通话 */
  VideoCall = 'video_call',
  /** 转接会话 */
  TransferConversation = 'transfer_conversation',
  /** 查看客户信息 */
  ViewProfile = 'view_profile',
  /** 使用快捷回复 */
  UseQuickReply = 'use_quick_reply',
}

/**
 * Agent 信息接口
 */
export interface AgentInfo extends User {
  /** Agent 能力列表 */
  capabilities: AgentCapabilityEnum[];
  /** Agent 部门 */
  department?: string;
  /** Agent 电话 */
  phone?: string;
  /** 最后活跃时间 */
  lastActiveAt?: number;
}

/**
 * Agent 统计信息
 */
export interface AgentStats {
  /** 总会话数 */
  totalConversations: number;
  /** 进行中的会话数 */
  activeConversations: number;
  /** 今日处理消息数 */
  messagesToday: number;
  /** 平均响应时间（毫秒） */
  avgResponseTime: number;
  /** 满意度评分 */
  satisfactionScore?: number;
}
