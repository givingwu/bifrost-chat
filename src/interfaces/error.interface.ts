/**
 * SDK 错误处理
 *
 * @description
 * 统一的错误类型和错误处理机制
 */

import {
  WEBSOCKET_ERROR_MESSAGES,
  WEBSOCKET_ERROR_TYPES,
} from '@/services/websocket/websocket.constants';

/**
 * SDK 错误基类
 */
export class SDKError extends Error {
  constructor(
    /** 错误消息 */
    message: string,
    /** 错误码 */
    public code: string,
    /** 错误详情 */
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.name = 'SDKError';
    Object.setPrototypeOf(this, SDKError.prototype);
  }
}

/**
 * WebSocket 错误基类
 *
 * @description
 * 继承自 SDKError，添加 timestamp 属性
 */
export class WebSocketError extends SDKError {
  readonly timestamp: number;

  constructor(
    code: keyof typeof WEBSOCKET_ERROR_TYPES,
    message?: string,
    context?: Record<string, unknown>,
  ) {
    const errorCode = WEBSOCKET_ERROR_TYPES[code];
    const errorMessage = message ?? WEBSOCKET_ERROR_MESSAGES[errorCode];

    super(errorMessage, errorCode, context);
    this.name = 'WebSocketError';
    this.timestamp = Date.now();

    // 维护正确的原型链
    Object.setPrototypeOf(this, WebSocketError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

/**
 * HTTP 网络错误
 */
export class HTTPError extends SDKError {
  constructor(
    message: string,
    public statusCode?: number,
    details?: Record<string, unknown>,
  ) {
    super(message, 'HTTP_ERROR', details);
    this.name = 'HTTPError';
    Object.setPrototypeOf(this, HTTPError.prototype);
  }
}

/**
 * 验证错误
 *
 * @description
 * 统一的验证错误，支持可选的 field 属性
 */
export class ValidationError extends SDKError {
  public field?: string;

  constructor(
    message: string,
    fieldOrDetails?: string | Record<string, unknown>,
    details?: Record<string, unknown>,
  ) {
    // 向后兼容：如果第二个参数是对象，则作为 details；如果是字符串，则作为 field
    if (typeof fieldOrDetails === 'string') {
      super(message, 'VALIDATION_ERROR', details);
      this.field = fieldOrDetails;
    } else {
      super(message, 'VALIDATION_ERROR', fieldOrDetails);
    }
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * 认证失败错误（WebSocket 专用）
 *
 * @description
 * WebSocket 场景的认证失败错误
 */
export class AuthFailedError extends WebSocketError {
  constructor(details?: Record<string, unknown>) {
    super('AUTH_FAILED', undefined, details);
    this.name = 'AuthFailedError';
    Object.setPrototypeOf(this, AuthFailedError.prototype);
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * 连接超时错误（WebSocket 专用）
 */
export class ConnectionTimeoutError extends WebSocketError {
  constructor(context?: Record<string, unknown>) {
    super('CONNECTION_TIMEOUT', undefined, context);
    this.name = 'ConnectionTimeoutError';
    Object.setPrototypeOf(this, ConnectionTimeoutError.prototype);
  }
}

/**
 * 连接失败错误（WebSocket 专用）
 */
export class ConnectionFailedError extends WebSocketError {
  constructor(context?: Record<string, unknown>) {
    super('CONNECTION_FAILED', undefined, context);
    this.name = 'ConnectionFailedError';
    Object.setPrototypeOf(this, ConnectionFailedError.prototype);
  }
}

/**
 * 发送失败错误（WebSocket 专用）
 */
export class SendFailedError extends WebSocketError {
  constructor(message?: string, context?: Record<string, unknown>) {
    super('SEND_FAILED', message, context);
    this.name = 'SendFailedError';
    Object.setPrototypeOf(this, SendFailedError.prototype);
  }
}

/**
 * 解析错误（WebSocket 专用）
 */
export class ParseError extends WebSocketError {
  constructor(originalError: unknown, context?: Record<string, unknown>) {
    super(
      'PARSE_ERROR',
      `Failed to parse message: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`,
      { ...context, originalError },
    );
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * 服务未实现错误
 */
export class NotImplementedError extends SDKError {
  constructor(
    message: string = 'This feature is not implemented',
    details?: Record<string, unknown>,
  ) {
    super(message, 'NOT_IMPLEMENTED_ERROR', details);
    this.name = 'NotImplementedError';
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

/**
 * Mapper 错误类型
 */
export class MapperError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MAPPER_ERROR', details);
    this.name = 'MapperError';
    Object.setPrototypeOf(this, MapperError.prototype);
  }
}

/**
 * 离线队列错误码枚举
 */
export enum OfflineQueueErrorCode {
  /** 队列已满 */
  QueueFull = 'QUEUE_FULL',
  /** 存储失败 */
  StorageError = 'STORAGE_ERROR',
  /** 消息过期 */
  MessageExpired = 'MESSAGE_EXPIRED',
  /** 达到最大重试次数 */
  MaxRetriesExceeded = 'MAX_RETRIES_EXCEEDED',
  /** 数据库未初始化 */
  DatabaseNotInitialized = 'DATABASE_NOT_INITIALIZED',
  /** 消息未找到 */
  MessageNotFound = 'MESSAGE_NOT_FOUND',
}

/**
 * 离线队列错误
 */
export class OfflineQueueError extends SDKError {
  constructor(
    message: string,
    public queueCode: OfflineQueueErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message, 'OFFLINE_QUEUE_ERROR', details);
    this.name = 'OfflineQueueError';
    Object.setPrototypeOf(this, OfflineQueueError.prototype);
  }
}

/**
 * 错误处理器
 *
 * @description
 * 提供统一的错误处理工具方法
 */
// biome-ignore lint/complexity/noStaticOnlyClass: <This is a expected >
export class ErrorHandler {
  /**
   * 判断是否为 WebSocket 错误
   */
  static isWebSocketError(error: unknown): error is WebSocketError {
    return error instanceof WebSocketError;
  }

  /**
   * 判断是否为可恢复错误
   *
   * @description
   * 某些错误可以通过重试恢复，如连接超时、连接失败等
   */
  static isRecoverable(error: unknown): boolean {
    if (!ErrorHandler.isWebSocketError(error)) {
      return false;
    }

    const recoverableCodes = [
      WEBSOCKET_ERROR_TYPES.CONNECTION_TIMEOUT,
      WEBSOCKET_ERROR_TYPES.CONNECTION_FAILED,
      WEBSOCKET_ERROR_TYPES.SEND_FAILED,
    ];

    return recoverableCodes.includes(
      error.code as (typeof recoverableCodes)[number],
    );
  }

  /**
   * 格式化错误信息用于日志
   */
  static formatForLogging(error: unknown): string {
    if (ErrorHandler.isWebSocketError(error)) {
      return `[${error.code}] ${error.message}${
        error.details ? ` | Details: ${JSON.stringify(error.details)}` : ''
      }`;
    }

    if (error instanceof SDKError) {
      return `[${error.code}] ${error.message}${
        error.details ? ` | Details: ${JSON.stringify(error.details)}` : ''
      }`;
    }

    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    return String(error);
  }

  /**
   * 从未知错误创建合适的错误对象
   */
  static fromUnknown(error: unknown): WebSocketError {
    if (ErrorHandler.isWebSocketError(error)) {
      return error;
    }

    if (error instanceof Error) {
      // 根据错误消息判断错误类型
      if (error.message.includes('timeout')) {
        return new ConnectionTimeoutError({
          originalError: error.message,
        });
      }
      if (error.message.includes('auth')) {
        return new AuthFailedError({ originalError: error.message });
      }
      if (error.message.includes('parse') || error.message.includes('JSON')) {
        return new ParseError(error);
      }
    }

    // 默认返回通用错误
    return new WebSocketError(
      'CONNECTION_FAILED',
      error instanceof Error ? error.message : String(error),
      { originalError: error },
    );
  }
}
