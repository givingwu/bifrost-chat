/**
 * 协议状态映射
 *
 * @description
 * 提供服务端状态与 SDK 内部枚举的双向映射函数
 */

import { AgentStatusEnum } from '@/interfaces/agent.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';

// ─── 服务端消息状态 ──────────────────────────────────────────────────────────

/**
 * 服务端 MessageStatus 枚举值
 * 对应文档: specs/bifrost-client-integration-guide.md 3.4.4
 */
export const SERVER_MESSAGE_STATUSES = [
  'UN_SEND',
  'SEND_FAIL',
  'DELIVER_FAIL',
  'UN_READ',
  'READ',
  'CLICK',
  'CLICKED',
  'REVOKE',
  'DELETE',
] as const;

/**
 * 服务端 MessageStatus 类型
 * 对应文档: specs/bifrost-client-integration-guide.md 3.4.4
 */
export type ServerMessageStatus = (typeof SERVER_MESSAGE_STATUSES)[number];

/**
 * 判断是否为有效的服务端 MessageStatus
 */
export function isServerMessageStatus(
  value: unknown,
): value is ServerMessageStatus {
  return (
    typeof value === 'string' &&
    SERVER_MESSAGE_STATUSES.includes(value.toUpperCase() as ServerMessageStatus)
  );
}

/**
 * 服务端 MessageStatus → SDK MessageStatusEnum 映射
 */
export function mapServerMessageStatusToLocal(
  serverStatus: ServerMessageStatus | Lowercase<ServerMessageStatus>,
): MessageStatusEnum {
  const normalized = serverStatus.toUpperCase() as ServerMessageStatus;
  const mapping: Record<ServerMessageStatus, MessageStatusEnum> = {
    UN_SEND: MessageStatusEnum.Sent,
    SEND_FAIL: MessageStatusEnum.Failed,
    DELIVER_FAIL: MessageStatusEnum.Failed,
    UN_READ: MessageStatusEnum.Delivered,
    READ: MessageStatusEnum.Read,
    CLICK: MessageStatusEnum.Clicked,
    CLICKED: MessageStatusEnum.Clicked,
    REVOKE: MessageStatusEnum.Revoked,
    DELETE: MessageStatusEnum.Deleted,
  };

  return mapping[normalized] ?? MessageStatusEnum.Sending;
}

/**
 * 渠道/供应商回调状态 → SDK MessageStatusEnum 映射。
 *
 * @description
 * FOX-8642 要求 RCS 等渠道的链接、按钮、reply/action 回调展示为
 * “点击”，且可以覆盖已读状态。该函数集中处理供应商原始回调值，
 * 避免 WebSocket handler、ACK handler 与消息队列各自维护映射。
 *
 * @param status 渠道回调中的状态值，如 sent / failed / action / reply
 * @returns 可识别的 SDK 消息状态；无法识别时返回 undefined
 */
export function mapCallbackMessageStatusToLocal(
  status: unknown,
): MessageStatusEnum | undefined {
  if (typeof status !== 'string') {
    return undefined;
  }

  const normalized = status.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }

  const mapping: Record<string, MessageStatusEnum> = {
    ACTION: MessageStatusEnum.Clicked,
    BUTTON_CLICK: MessageStatusEnum.Clicked,
    BUTTON_CLICKED: MessageStatusEnum.Clicked,
    CLICK: MessageStatusEnum.Clicked,
    CLICKED: MessageStatusEnum.Clicked,
    LINK_CLICK: MessageStatusEnum.Clicked,
    LINK_CLICKED: MessageStatusEnum.Clicked,
    REPLIED: MessageStatusEnum.Clicked,
    REPLY: MessageStatusEnum.Clicked,

    DELIVER_SUCCESS: MessageStatusEnum.Delivered,
    DELIVERED: MessageStatusEnum.Delivered,
    UN_READ: MessageStatusEnum.Delivered,

    READ: MessageStatusEnum.Read,
    RECEIVER_OPENED: MessageStatusEnum.Read,

    SEND: MessageStatusEnum.Sent,
    SENT: MessageStatusEnum.Sent,
    SUBMITTED: MessageStatusEnum.Sent,
    UN_SEND: MessageStatusEnum.Sent,

    DELIVER_FAIL: MessageStatusEnum.Failed,
    FAILED: MessageStatusEnum.Failed,
    SEND_FAIL: MessageStatusEnum.Failed,
    SUBMIT_FAIL: MessageStatusEnum.Failed,

    DELETE: MessageStatusEnum.Deleted,
    REVOKE: MessageStatusEnum.Revoked,
  };

  return mapping[normalized];
}

/**
 * SDK MessageStatusEnum → 服务端 MessageStatus 映射
 */
export function mapLocalMessageStatusToServer(
  localStatus: MessageStatusEnum,
): ServerMessageStatus | null {
  const mapping: Record<MessageStatusEnum, ServerMessageStatus | null> = {
    [MessageStatusEnum.Created]: 'UN_SEND',
    [MessageStatusEnum.Sending]: 'UN_SEND',
    [MessageStatusEnum.Sent]: 'UN_SEND',
    [MessageStatusEnum.Delivered]: 'UN_READ',
    [MessageStatusEnum.Read]: 'READ',
    [MessageStatusEnum.Clicked]: null,
    [MessageStatusEnum.Failed]: 'SEND_FAIL',
    [MessageStatusEnum.Queued]: 'UN_SEND',
    [MessageStatusEnum.Revoked]: 'REVOKE',
    [MessageStatusEnum.Deleted]: 'DELETE',
  };

  return mapping[localStatus] ?? null;
}

// ─── 服务端 Agent 状态 ───────────────────────────────────────────────────────

/**
 * 服务端 AgentStatus 类型
 */
export type ServerAgentStatus =
  | 'offline'
  | 'ready'
  | 'rest'
  | 'busy'
  | 'hang_up';

/**
 * 服务端 AgentStatus → SDK AgentStatusEnum 映射
 */
export function mapServerAgentStatusToLocal(
  serverStatus: ServerAgentStatus,
): AgentStatusEnum {
  const mapping: Record<ServerAgentStatus, AgentStatusEnum> = {
    offline: AgentStatusEnum.Offline,
    ready: AgentStatusEnum.Online,
    rest: AgentStatusEnum.Away,
    busy: AgentStatusEnum.Busy,
    hang_up: AgentStatusEnum.HangUp,
  };
  return mapping[serverStatus] ?? AgentStatusEnum.Offline;
}

/**
 * SDK AgentStatusEnum → 服务端 AgentStatus 映射
 */
export function mapLocalAgentStatusToServer(
  localStatus: AgentStatusEnum,
): ServerAgentStatus {
  const mapping: Record<AgentStatusEnum, ServerAgentStatus> = {
    [AgentStatusEnum.Online]: 'ready',
    [AgentStatusEnum.Offline]: 'offline',
    [AgentStatusEnum.Away]: 'rest',
    [AgentStatusEnum.Busy]: 'busy',
    [AgentStatusEnum.HangUp]: 'hang_up',
    [AgentStatusEnum.InCall]: 'busy',
    [AgentStatusEnum.DoNotDisturb]: 'busy',
  };
  return mapping[localStatus] ?? 'offline';
}
