/**
 * 发送结果标准化：将后端通用 code/data 约定转为 MessageSendResult。
 * - code === 1：抛错，由上层 Hook（如 useSendMessage）在 onError 中处理并决定是否回退。
 * - code === 0：默认映射为「成功」结果，具体是否回退由业务应用根据自身规则解释。
 */

import type { MessageSendResult } from '@/interfaces/message.interface';
import { MessageStatusEnum } from '@/interfaces/message.interface';

/** 后端通用响应：最外层 code 0 成功 / 1 失败，data 为可选业务体 */
export interface BackendSendResponse<TData = BackendSendData> {
  code: number;
  message?: string;
  data?: TData | null;
}

/** 标准化所需 data 最小形状（id/messageId/status/errorMsg 等由业务映射） */
export interface BackendSendData {
  id?: number;
  messageId?: string;
  status?: number;
  errorMsg?: string;
}

export interface NormalizeSendResultOptions<TData extends BackendSendData> {
  /** 将后端 status 数字映射为 MessageStatusEnum */
  mapStatus: (backendStatus: number | undefined) => MessageStatusEnum;
  /** 可选：从 data 取 messageId，默认 data.messageId ?? String(data.id) */
  getMessageId?: (data: TData) => string | undefined;
  /** 可选：从 data 取 tempId，默认同 getMessageId */
  getTempId?: (data: TData) => string;
}

/**
 * 创建「不回退」的发送结果（用于 code=0 但无 data 或请求抛错但解析到 code=0 等场景）。
 * 默认设置 status: Sent，仅作为业务侧「不回退」的推荐返回形态。
 */
export function createNoRollbackResult(): MessageSendResult {
  return {
    tempId: '',
    status: MessageStatusEnum.Sent,
  };
}

/**
 * 从请求抛错信息中尝试解析后端 code（如 "{\"code\":0}"）。
 * 用于请求抛错但实际业务成功（code=0）时避免误回退。
 * @returns 解析到的 code，无法解析时返回 undefined
 */
export function parseResponseCodeFromError(err: unknown): number | undefined {
  const str =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const match = str.match(/"code"\s*:\s*(-?\d+)/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

/**
 * 将后端 send 接口响应标准化为 MessageSendResult。
 * - code === 1：抛出 Error，由 mutation onError 处理并回退。
 * - code === 0：根据 data 填充 tempId/messageId/status 等，是否回退由上层依据 status/error 决定。
 */
export function normalizeSendResult<TData extends BackendSendData>(
  res: BackendSendResponse<TData>,
  options: NormalizeSendResultOptions<TData>,
): MessageSendResult {
  const { mapStatus, getMessageId, getTempId } = options;

  if (res.code === 1) {
    const errorMessage =
      typeof res.message === 'string' ? res.message : '发送失败';
    throw new Error(errorMessage);
  }

  if (!res.data) {
    return createNoRollbackResult();
  }

  const data = res.data;
  const messageId = getMessageId
    ? getMessageId(data)
    : (data.messageId ?? (data.id != null ? String(data.id) : undefined));
  const tempId = getTempId
    ? getTempId(data)
    : (messageId ?? (data.id != null ? String(data.id) : ''));
  const status = mapStatus(data.status);

  return {
    tempId,
    messageId,
    status,
    retryCount: 1,
    ...(data.errorMsg != null &&
      data.errorMsg !== '' && { error: data.errorMsg }),
  };
}
