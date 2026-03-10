/**
 * WebSocket 专用错误类
 *
 * @description
 * 继承自 SDKError，用于 WebSocket 连接、发送、解析等场景的错误
 */

import {
    WEBSOCKET_ERROR_MESSAGES,
    WEBSOCKET_ERROR_TYPES,
} from '@/services/websocket/websocket.constants';
import { SDKError } from './sdk.errors';

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
            `Failed to parse message: ${originalError instanceof Error
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
            return `[${error.code}] ${error.message}${error.details ? ` | Details: ${JSON.stringify(error.details)}` : ''
                }`;
        }

        if (error instanceof SDKError) {
            return `[${error.code}] ${error.message}${error.details ? ` | Details: ${JSON.stringify(error.details)}` : ''
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
