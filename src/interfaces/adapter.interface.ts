import type { ChannelTypeEnum } from '@/interfaces/channel.interface';
import type { StandardMessage } from '@/interfaces/message.interface';
import type { MessageTemplate } from './template.interface';

/**
 * 适配器错误码枚举
 */
export enum AdapterErrorCodeEnum {
  /** 未知错误 */
  Unknown = 'UNKNOWN',
  /** 网络错误 */
  NetworkError = 'NETWORK_ERROR',
  /** 认证失败 */
  AuthenticationFailed = 'AUTH_FAILED',
  /** 权限不足 */
  PermissionDenied = 'PERMISSION_DENIED',
  /** 参数无效 */
  InvalidParams = 'INVALID_PARAMS',
  /** 渠道不支持 */
  ChannelNotSupported = 'CHANNEL_NOT_SUPPORTED',
  /** 消息发送失败 */
  SendFailed = 'SEND_FAILED',
  /** 消息格式错误 */
  MessageFormatError = 'MESSAGE_FORMAT_ERROR',
  /** 媒体上传失败 */
  MediaUploadFailed = 'MEDIA_UPLOAD_FAILED',
  /** 模板不存在 */
  TemplateNotFound = 'TEMPLATE_NOT_FOUND',
  /** 配额超限 */
  QuotaExceeded = 'QUOTA_EXCEEDED',
  /** 服务不可用 */
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
}

/**
 * 适配器错误类
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: AdapterErrorCodeEnum,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AdapterError';
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

/**
 * 适配器配置
 */
export interface AdapterConfig {
  /** API 端点 */
  endpoint: string;
  /** 认证 Token */
  token?: string;
  /** 调试模式 */
  debug?: boolean;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 额外配置 */
  extra?: Record<string, unknown>;
}

/**
 * 适配器工厂函数类型
 * - 延迟实例化，按需创建适配器实例
 */
export type AdapterFactoryFn = () => IChannelAdapter;

/**
 * 适配器工厂配置选项
 */
export interface AdapterFactoryOptions {
  /** 是否启用调试日志 */
  debug?: boolean;
  /** 是否允许覆盖已注册的适配器 */
  allowOverride?: boolean;
  /** 自定义日志函数 */
  logger?: {
    info?: (message: string, ...args: unknown[]) => void;
    warn?: (message: string, ...args: unknown[]) => void;
    error?: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * 适配器注册信息
 * - 包含工厂函数和元数据
 */
export interface AdapterRegistration {
  /** 工厂函数 */
  factory: AdapterFactoryFn;
  /** 注册时间戳 */
  registeredAt: number;
  /** 是否为内置适配器 */
  isBuiltin: boolean;
}

/**
 * 适配器工厂接口
 * - 定义工厂的公共契约
 */
export interface IAdapterFactory {
  /**
   * 创建适配器实例
   */
  createAdapter(channelType: ChannelTypeEnum): IChannelAdapter;

  /**
   * 检查渠道是否支持
   */
  isSupported(channelType: ChannelTypeEnum): boolean;

  /**
   * 获取支持的渠道列表
   */
  getSupportedChannels(): readonly ChannelTypeEnum[];

  /**
   * 注册适配器
   */
  registerAdapter(
    channelType: ChannelTypeEnum,
    factory: AdapterFactoryFn,
    options?: { allowOverride?: boolean },
  ): void;

  /**
   * 注销适配器
   */
  unregisterAdapter(
    channelType: ChannelTypeEnum,
    options?: { force?: boolean },
  ): void;

  /**
   * 重置为默认状态
   */
  reset(): void;
}

/**
 * 文本发送参数
 */
export interface TextSendParams {
  /** 接收者 ID */
  to: string;
  /** 消息内容 */
  content: string;
  /** 预览 URL（可选） */
  previewUrl?: boolean;
}

/**
 * 媒体发送参数
 */
export interface MediaSendParams {
  /** 接收者 ID */
  to: string;
  /** 媒体类型 */
  mediaType: 'image' | 'video' | 'audio' | 'document';
  /** 媒体 URL 或 ID */
  mediaUrl?: string;
  /** 媒体 ID（已上传的媒体） */
  mediaId?: string;
  /** 标题/说明（可选） */
  caption?: string;
  /** 文件名（可选，仅 document） */
  filename?: string;
}

/**
 * 模板发送参数
 */
export interface TemplateSendParams {
  /** 接收者 ID */
  to: string;
  /** 模板 ID 或模板名称 */
  templateId: string;
  /** 模板参数（用于填充模板中的变量） */
  params?: Record<string, string>;
  /** 语言代码（可选） */
  languageCode?: string;
}

/**
 * 交互上报参数
 */
export interface InteractionReportParams {
  /** 消息 ID */
  messageId: string;
  /** 交互类型 */
  interactionType: 'read' | 'delivered';
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 发送状态枚举
 */
export enum SendStatusEnum {
  /** 发送中 */
  Sending = 'sending',
  /** 发送成功 */
  Success = 'success',
  /** 发送失败 */
  Failed = 'failed',
  /** 等待重试 */
  PendingRetry = 'pending_retry',
}

/**
 * 发送结果
 */
export interface SendResult {
  /** 临时消息 ID */
  tempId: string;
  /** 发送状态 */
  status: SendStatusEnum;
  /** 错误信息（如果失败） */
  error?: string;
  /** 错误码（如果失败） */
  errorCode?: AdapterErrorCodeEnum;
  /** 错误详情（如果失败） */
  errorDetails?: Record<string, unknown>;
  /** 重试次数 */
  retryCount?: number;
  /** 服务器返回的消息 ID（如果成功） */
  messageId?: string;
}

/**
 * 基础渠道适配器接口
 * - 所有渠道适配器必须实现此接口
 */
export interface IChannelAdapter {
  /** 渠道类型 */
  readonly channelType: ChannelTypeEnum;

  /**
   * 初始化适配器
   * @param config 适配器配置
   */
  initialize(config: AdapterConfig): Promise<void>;

  /**
   * 销毁适配器
   * - 清理资源、断开连接等
   */
  destroy(): void;

  /**
   * 检查适配器是否已初始化
   */
  isInitialized(): boolean;
}

/**
 * 文本发送能力接口
 * - 支持发送文本消息的适配器应实现此接口
 */
export interface ITextSender {
  /**
   * 发送文本消息
   * @param params 发送参数
   * @returns 发送结果
   */
  sendText(params: TextSendParams): Promise<SendResult>;
}

/**
 * 媒体发送能力接口
 * - 支持发送媒体消息的适配器应实现此接口
 */
export interface IMediaSender {
  /**
   * 发送媒体消息
   * @param params 发送参数
   * @returns 发送结果
   */
  sendMedia(params: MediaSendParams): Promise<SendResult>;

  /**
   * 上传媒体文件
   * @param file 文件对象
   * @returns 媒体 ID
   */
  uploadMedia(file: File): Promise<string>;
}

/**
 * 交互上报能力接口
 * - 支持上报用户交互（如已读回执）的适配器应实现此接口
 */
export interface IInteractionReporter {
  /**
   * 上报用户交互
   * @param params 上报参数
   */
  reportInteraction(params: InteractionReportParams): Promise<void>;
}

/**
 * 消息接收器接口
 * - 支持接收消息的适配器应实现此接口
 */
export interface IMessageReceiver {
  /**
   * 处理接收到的消息
   * @param rawData 原始数据
   * @returns 标准化消息
   */
  handleIncomingMessage(rawData: unknown): Promise<StandardMessage>;

  /**
   * 处理 ACK 回执
   * @param rawData 原始 ACK 数据
   * @returns 消息 ID 和状态
   */
  handleAck(rawData: unknown): Promise<{ messageId: string; status: string }>;
}

/**
 * 模板发送能力接口
 * - 支持发送模板消息的适配器应实现此接口
 */
export interface ITemplateSender {
  /**
   * 发送模板消息
   * @param params 发送参数
   * @returns 发送结果
   */
  sendTemplate(params: TemplateSendParams): Promise<SendResult>;

  /**
   * 获取可用模板列表
   * @returns 模板列表
   */
  getTemplates(): Promise<MessageTemplate[]>;
}

/**
 * 健康检查接口
 * - 支持健康检查的适配器应实现此接口
 */
export interface IHealthCheckable {
  /**
   * 检查适配器健康状态
   * @returns 健康状态
   */
  healthCheck(): Promise<HealthStatus>;
}

/**
 * 健康状态
 */
export interface HealthStatus {
  /** 是否健康 */
  isHealthy: boolean;
  /** 延迟（毫秒） */
  latency?: number;
  /** 错误信息（如果不健康） */
  error?: string;
  /** 额外信息 */
  details?: Record<string, unknown>;
}
