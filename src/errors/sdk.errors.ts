/**
 * SDK 错误类
 *
 * @description
 * 通用 SDK 错误和非 WebSocket 专用错误类
 */

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
