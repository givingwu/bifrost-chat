/**
 * 网络错误类
 *
 * @description
 * 继承自 SDKError，用于 HTTP/网络层错误
 */

import type { NetworkErrorCodeEnum } from '@/interfaces/network.interface';
import { SDKError } from './sdk.errors';

/**
 * 网络错误
 */
export class NetworkError extends SDKError {
  constructor(
    message: string,
    public readonly errorCode: NetworkErrorCodeEnum,
    public readonly statusCode?: number,
    details?: Record<string, unknown>,
  ) {
    super(message, 'NETWORK_ERROR', { errorCode, statusCode, ...details });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
