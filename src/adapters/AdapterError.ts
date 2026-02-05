import type { ChannelTypeEnum } from '@/interfaces/channel.interface';

/**
 * 适配器错误基类
 * - 提供结构化的错误信息
 * - 支持错误码和上下文信息
 */
export class AdapterError extends Error {
  /**
   * 错误码
   */
  readonly code: string;

  /**
   * 渠道类型（如果适用）
   */
  readonly channelType?: ChannelTypeEnum;

  /**
   * 额外的上下文信息
   */
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    options?: {
      channelType?: ChannelTypeEnum;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'AdapterError';
    this.code = code;
    this.channelType = options?.channelType;
    this.context = options?.context;

    // 维护正确的原型链
    Object.setPrototypeOf(this, AdapterError.prototype);
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      channelType: this.channelType,
      context: this.context,
    };
  }
}

/**
 * 错误码枚举
 */
export enum AdapterErrorCode {
  /** 不支持的渠道类型 */
  UNSUPPORTED_CHANNEL = 'UNSUPPORTED_CHANNEL',
  /** 适配器未注册 */
  ADAPTER_NOT_REGISTERED = 'ADAPTER_NOT_REGISTERED',
  /** 适配器已注册 */
  ADAPTER_ALREADY_REGISTERED = 'ADAPTER_ALREADY_REGISTERED',
  /** 无效的适配器工厂函数 */
  INVALID_ADAPTER_FACTORY = 'INVALID_ADAPTER_FACTORY',
  /** 适配器初始化失败 */
  ADAPTER_INIT_FAILED = 'ADAPTER_INIT_FAILED',
}

/**
 * 创建不支持的渠道类型错误
 */
export function createUnsupportedChannelError(
  channelType: ChannelTypeEnum,
  supportedChannels: readonly ChannelTypeEnum[],
): AdapterError {
  return new AdapterError(
    `Unsupported channel type: ${channelType}. ` +
      `Supported channels: ${Array.from(supportedChannels).join(', ')}`,
    AdapterErrorCode.UNSUPPORTED_CHANNEL,
    {
      channelType,
      context: { supportedChannels: Array.from(supportedChannels) },
    },
  );
}

/**
 * 创建适配器未注册错误
 */
export function createAdapterNotRegisteredError(
  channelType: ChannelTypeEnum,
): AdapterError {
  return new AdapterError(
    `Adapter not registered for channel: ${channelType}`,
    AdapterErrorCode.ADAPTER_NOT_REGISTERED,
    { channelType },
  );
}

/**
 * 创建适配器已注册错误
 */
export function createAdapterAlreadyRegisteredError(
  channelType: ChannelTypeEnum,
): AdapterError {
  return new AdapterError(
    `Adapter already registered for channel: ${channelType}`,
    AdapterErrorCode.ADAPTER_ALREADY_REGISTERED,
    { channelType },
  );
}

/**
 * 创建无效的适配器工厂函数错误
 */
export function createInvalidAdapterFactoryError(
  channelType: ChannelTypeEnum,
): AdapterError {
  return new AdapterError(
    `Invalid adapter factory function for channel: ${channelType}`,
    AdapterErrorCode.INVALID_ADAPTER_FACTORY,
    { channelType },
  );
}
