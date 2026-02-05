import type {
  MessageStatusEnum,
  StandardMessage,
} from '@/interfaces/message.interface';

/**
 * Mapper 接口
 * - 负责在标准消息和渠道特定 DTO 之间进行转换
 * - 使用 Zod 进行 Schema 校验，防止脏数据污染 Store
 * - 纯函数设计，便于单元测试
 */
export interface IMapper<TInbound, TOutbound, TAck> {
  /**
   * 将标准消息转换为渠道特定的 Outbound DTO
   * @param message 标准消息
   * @returns 渠道特定的 Outbound DTO
   */
  outboundToDto(message: StandardMessage): TOutbound;

  /**
   * 将渠道特定的 Inbound DTO 转换为标准消息
   * @param dto 渠道特定的 Inbound DTO
   * @returns 标准化消息
   */
  inboundToStandard(dto: TInbound): StandardMessage;

  /**
   * 将渠道特定的 ACK DTO 转换为消息状态
   * @param ack 渠道特定的 ACK DTO
   * @returns 消息状态
   */
  ackToStatus(ack: TAck): MessageStatusEnum;

  /**
   * 批量将标准消息转换为 Outbound DTO
   * @param messages 标准消息数组
   * @returns Outbound DTO 数组
   */
  batchOutboundToDto(messages: StandardMessage[]): TOutbound[];

  /**
   * 批量将 Inbound DTO 转换为标准消息
   * @param dtos Inbound DTO 数组
   * @returns 标准化消息数组
   */
  batchInboundToStandard(dtos: TInbound[]): StandardMessage[];

  /**
   * 校验 Inbound DTO
   * @param dto 原始 DTO 数据
   * @returns 校验后的 Inbound DTO
   * @throws 如果校验失败
   */
  validateInbound(dto: unknown): TInbound;

  /**
   * 校验 Outbound DTO
   * @param dto 原始 DTO 数据
   * @returns 校验后的 Outbound DTO
   * @throws 如果校验失败
   */
  validateOutbound(dto: unknown): TOutbound;

  /**
   * 校验 ACK DTO
   * @param dto 原始 DTO 数据
   * @returns 校验后的 ACK DTO
   * @throws 如果校验失败
   */
  validateAck(dto: unknown): TAck;

  /**
   * 批量校验 Inbound DTO
   * @param dtos 原始 DTO 数据数组
   * @returns 校验后的 Inbound DTO 数组
   * @throws 如果校验失败
   */
  batchValidateInbound(dtos: unknown[]): TInbound[];

  /**
   * 批量校验 Outbound DTO
   * @param dtos 原始 DTO 数据数组
   * @returns 校验后的 Outbound DTO 数组
   * @throws 如果校验失败
   */
  batchValidateOutbound(dtos: unknown[]): TOutbound[];
}

/**
 * Mapper 性能指标
 */
export interface MapperMetrics {
  /** 转换次数 */
  transformCount: number;
  /** 校验次数 */
  validateCount: number;
  /** 错误次数 */
  errorCount: number;
  /** 平均转换时间（毫秒） */
  avgTransformTime: number;
  /** 平均校验时间（毫秒） */
  avgValidateTime: number;
}

/**
 * Mapper 错误类型
 */
export class MapperError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'MapperError';
    Object.setPrototypeOf(this, MapperError.prototype);
  }
}

/**
 * 校验错误类型
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Mapper 配置选项
 */
export interface MapperOptions {
  /** 是否启用性能监控 */
  enableMetrics?: boolean;
  /** 是否启用严格模式（严格校验） */
  strictMode?: boolean;
  /** 是否忽略未知字段 */
  ignoreUnknown?: boolean;
  /** 自定义校验钩子 */
  validationHooks?: {
    beforeValidate?: (data: unknown) => unknown;
    afterValidate?: (data: unknown) => unknown;
    onValidationError?: (error: ValidationError) => void;
  };
}
