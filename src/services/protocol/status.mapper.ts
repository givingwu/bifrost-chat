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
        SERVER_MESSAGE_STATUSES.includes(value as ServerMessageStatus)
    );
}

/**
 * 服务端 MessageStatus → SDK MessageStatusEnum 映射
 */
export function mapServerMessageStatusToLocal(
    serverStatus: ServerMessageStatus,
): MessageStatusEnum {
    const mapping: Record<ServerMessageStatus, MessageStatusEnum> = {
        UN_SEND: MessageStatusEnum.Sending,
        SEND_FAIL: MessageStatusEnum.Failed,
        DELIVER_FAIL: MessageStatusEnum.Failed,
        UN_READ: MessageStatusEnum.Delivered,
        READ: MessageStatusEnum.Read,
        REVOKE: MessageStatusEnum.Revoked,
        DELETE: MessageStatusEnum.Deleted,
    };

    return mapping[serverStatus] ?? MessageStatusEnum.Sending;
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
