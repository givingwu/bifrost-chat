/**
 * SDK 错误
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
 * HTTP 网络错误（与 NetworkError 区分）
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
 */
export class ValidationError extends SDKError {
  constructor(
    message: string,
    public field?: string,
    details?: Record<string, unknown>,
  ) {
    super(message, 'VALIDATION_ERROR', details);
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
