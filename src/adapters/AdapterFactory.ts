import type {
  AdapterFactoryFn,
  AdapterFactoryOptions,
  AdapterRegistration,
  IAdapterFactory,
  IChannelAdapter,
} from '@/interfaces/adapter.interface';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  AdapterError,
  AdapterErrorCode,
  createAdapterAlreadyRegisteredError,
  createAdapterNotRegisteredError,
  createInvalidAdapterFactoryError,
  createUnsupportedChannelError,
} from './AdapterError';
import { WabaAdapter } from './waba/WabaAdapter';

/**
 * AdapterFactoryImpl
 *
 * ## 职责
 * - 根据渠道类型创建对应的适配器实例
 * - 使用工厂模式管理适配器的创建和注册
 * - 支持动态注册新的适配器
 * - 提供适配器生命周期管理
 *
 * ## 设计模式
 * - **工厂模式**: 封装适配器实例的创建逻辑
 * - **单例模式**: 全局唯一的工厂实例
 * - **注册表模式**: 维护适配器类型到工厂函数的映射
 *
 * ## 性能优化
 * - 延迟实例化：只在需要时创建适配器实例
 * - 缓存支持的渠道列表：避免重复计算
 * - 使用 readonly 保护内部状态
 *
 * ## 使用示例
 * ```typescript
 * // 创建适配器实例
 * const adapter = AdapterFactory.createAdapter(ChannelTypeEnum.Waba);
 *
 * // 注册自定义适配器
 * AdapterFactory.registerAdapter(
 *   ChannelTypeEnum.SMS,
 *   () => new SMSAdapter()
 * );
 *
 * // 检查渠道支持
 * if (AdapterFactory.isSupported(ChannelTypeEnum.SMS)) {
 *   // ...
 * }
 * ```
 */
class AdapterFactoryImpl implements IAdapterFactory {
  private readonly adapters: Map<ChannelTypeEnum, AdapterRegistration>;
  private readonly supportedChannels: ChannelTypeEnum[];
  private readonly options: Required<AdapterFactoryOptions>;

  /**
   * 私有构造函数，防止直接实例化
   */
  constructor(options?: AdapterFactoryOptions) {
    this.adapters = new Map();
    this.supportedChannels = [];
    this.options = {
      debug: options?.debug ?? false,
      allowOverride: options?.allowOverride ?? false,
      logger: {
        info: options?.logger?.info ?? console.info.bind(console),
        warn: options?.logger?.warn ?? console.warn.bind(console),
        error: options?.logger?.error ?? console.error.bind(console),
      },
    };

    // 注册默认适配器
    this.registerDefaultAdapters();
  }

  /**
   * 注册默认适配器
   * - 在构造函数中自动调用
   * - 注册所有内置的渠道适配器
   */
  private registerDefaultAdapters(): void {
    // 注册 WABA 适配器
    this.registerAdapterInternal(
      ChannelTypeEnum.Waba,
      () => new WabaAdapter(),
      {
        isBuiltin: true,
      },
    );

    // 未来添加其他适配器
    // this.registerAdapterInternal(ChannelTypeEnum.SMS, () => new SMSAdapter(), { isBuiltin: true });
    // this.registerAdapterInternal(ChannelTypeEnum.WhatsApp, () => new WhatsAppAdapter(), { isBuiltin: true });
    // this.registerAdapterInternal(ChannelTypeEnum.Email, () => new EmailAdapter(), { isBuiltin: true });
  }

  /**
   * 内部注册方法
   * - 不检查覆盖，直接注册
   * - 用于初始化时的批量注册
   */
  private registerAdapterInternal(
    channelType: ChannelTypeEnum,
    factory: AdapterFactoryFn,
    options: { isBuiltin: boolean },
  ): void {
    this.adapters.set(channelType, {
      factory,
      registeredAt: Date.now(),
      isBuiltin: options.isBuiltin,
    });

    // 更新缓存
    this.updateSupportedChannels();

    this.logDebug(`Registered adapter for channel: ${channelType}`, {
      isBuiltin: options.isBuiltin,
    });
  }

  /**
   * 验证适配器工厂函数
   * - 确保工厂函数返回有效的适配器实例
   */
  private validateAdapterFactory(
    channelType: ChannelTypeEnum,
    factory: AdapterFactoryFn,
  ): void {
    try {
      const adapter = factory();

      // 验证返回值是对象
      if (typeof adapter !== 'object' || adapter === null) {
        throw new Error('Factory function must return an object');
      }

      // 验证必需的属性
      if (typeof adapter.channelType !== 'string') {
        throw new Error('Adapter must have a channelType property');
      }

      // 验证必需的方法
      const requiredMethods: Array<keyof IChannelAdapter> = [
        'initialize',
        'destroy',
        'isInitialized',
      ];
      for (const method of requiredMethods) {
        if (typeof adapter[method] !== 'function') {
          throw new Error(`Adapter must implement ${method}() method`);
        }
      }

      // 验证 channelType 匹配
      if (adapter.channelType !== channelType) {
        throw new Error(
          `Adapter channelType (${adapter.channelType}) does not match registered channel (${channelType})`,
        );
      }
    } catch (error) {
      this.logError('Failed to validate adapter factory', {
        channelType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw createInvalidAdapterFactoryError(channelType);
    }
  }

  /**
   * 更新支持的渠道缓存
   * - 在注册或注销适配器后调用
   */
  private updateSupportedChannels(): void {
    // 清空并重新填充缓存
    this.supportedChannels.length = 0;
    this.supportedChannels.push(...Array.from(this.adapters.keys()));
  }

  /**
   * 记录调试日志
   */
  private logDebug(message: string, ...args: unknown[]): void {
    if (this.options.debug) {
      this.options.logger.info?.(`[AdapterFactory] ${message}`, ...args);
    }
  }

  /**
   * 记录警告日志
   */
  private logWarn(message: string, ...args: unknown[]): void {
    this.options.logger.warn?.(`[AdapterFactory] ${message}`, ...args);
  }

  /**
   * 记录错误日志
   */
  private logError(message: string, ...args: unknown[]): void {
    this.options.logger.error?.(`[AdapterFactory] ${message}`, ...args);
  }

  /**
   * 根据渠道类型创建对应的适配器实例
   *
   * @param channelType - 渠道类型
   * @returns 适配器实例
   * @throws {AdapterError} 如果渠道类型不支持
   *
   * @example
   * ```typescript
   * const adapter = AdapterFactory.createAdapter(ChannelTypeEnum.Waba);
   * await adapter.initialize({ endpoint: 'https://api.example.com' });
   * ```
   */
  createAdapter(channelType: ChannelTypeEnum): IChannelAdapter {
    const registration = this.adapters.get(channelType);

    if (!registration) {
      this.logError('Attempted to create adapter for unsupported channel', {
        channelType,
        supportedChannels: Array.from(this.adapters.keys()),
      });
      throw createUnsupportedChannelError(
        channelType,
        Array.from(this.adapters.keys()),
      );
    }

    try {
      const adapter = registration.factory();

      this.logDebug('Created adapter instance', {
        channelType,
        adapterType: adapter.constructor.name,
      });

      return adapter;
    } catch (error) {
      this.logError('Failed to create adapter instance', {
        channelType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 检查渠道类型是否支持
   *
   * @param channelType - 渠道类型
   * @returns 是否支持该渠道
   *
   * @example
   * ```typescript
   * if (AdapterFactory.isSupported(ChannelTypeEnum.Waba)) {
   *   // 渠道支持，可以创建适配器
   * }
   * ```
   */
  isSupported(channelType: ChannelTypeEnum): boolean {
    return this.adapters.has(channelType);
  }

  /**
   * 获取所有支持的渠道类型
   * - 返回缓存的渠道列表，避免重复计算
   * - 返回只读数组，防止外部修改
   *
   * @returns 支持的渠道类型只读数组
   *
   * @example
   * ```typescript
   * const channels = AdapterFactory.getSupportedChannels();
   * console.log('Supported channels:', channels);
   * // ['waba', 'sms', 'whatsapp', 'email']
   * ```
   */
  getSupportedChannels(): readonly ChannelTypeEnum[] {
    return this.supportedChannels;
  }

  /**
   * 注册新的适配器
   * - 支持运行时动态扩展新的渠道类型
   * - 默认不允许覆盖已注册的适配器（除非是内置适配器或显式允许）
   *
   * @param channelType - 渠道类型
   * @param factory - 适配器工厂函数
   * @param options - 注册选项
   * @throws {AdapterError} 如果适配器已注册且不允许覆盖
   * @throws {AdapterError} 如果工厂函数验证失败
   *
   * @example
   * ```typescript
   * // 注册自定义适配器
   * AdapterFactory.registerAdapter(
   *   ChannelTypeEnum.SMS,
   *   () => new SMSAdapter()
   * );
   *
   * // 覆盖已注册的适配器
   * AdapterFactory.registerAdapter(
   *   ChannelTypeEnum.Waba,
   *   () => new CustomWabaAdapter(),
   *   { allowOverride: true }
   * );
   * ```
   */
  registerAdapter(
    channelType: ChannelTypeEnum,
    factory: AdapterFactoryFn,
    options?: { allowOverride?: boolean },
  ): void {
    const existing = this.adapters.get(channelType);
    const allowOverride = options?.allowOverride ?? this.options.allowOverride;

    // 检查是否已注册
    if (existing) {
      // 如果不允许覆盖，抛出错误
      if (!allowOverride && !existing.isBuiltin) {
        this.logWarn('Attempted to register already registered adapter', {
          channelType,
          registeredAt: new Date(existing.registeredAt).toISOString(),
        });
        throw createAdapterAlreadyRegisteredError(channelType);
      }

      // 允许覆盖内置适配器，但记录警告
      if (existing.isBuiltin) {
        this.logWarn('Overriding built-in adapter', {
          channelType,
          registeredAt: new Date(existing.registeredAt).toISOString(),
        });
      }
    }

    // 验证工厂函数
    this.validateAdapterFactory(channelType, factory);

    // 注册适配器
    this.registerAdapterInternal(channelType, factory, {
      isBuiltin: false,
    });
  }

  /**
   * 注销适配器
   * - 移除已注册的适配器
   * - 不允许注销内置适配器（除非显式强制）
   *
   * @param channelType - 渠道类型
   * @param options - 注销选项
   * @throws {AdapterError} 如果适配器未注册
   * @throws {AdapterError} 如果尝试注销内置适配器
   *
   * @example
   * ```typescript
   * // 注销自定义适配器
   * AdapterFactory.unregisterAdapter(ChannelTypeEnum.SMS);
   *
   * // 强制注销内置适配器（不推荐）
   * AdapterFactory.unregisterAdapter(ChannelTypeEnum.Waba, { force: true });
   * ```
   */
  unregisterAdapter(
    channelType: ChannelTypeEnum,
    options?: { force?: boolean },
  ): void {
    const registration = this.adapters.get(channelType);

    if (!registration) {
      this.logWarn('Attempted to unregister non-existent adapter', {
        channelType,
      });
      throw createAdapterNotRegisteredError(channelType);
    }

    // 不允许注销内置适配器（除非强制）
    if (registration.isBuiltin && !options?.force) {
      this.logWarn('Attempted to unregister built-in adapter', {
        channelType,
      });
      throw new AdapterError(
        `Cannot unregister built-in adapter for channel: ${channelType}. ` +
          `Use { force: true } to override.`,
        AdapterErrorCode.ADAPTER_NOT_REGISTERED,
        { channelType },
      );
    }

    // 注销适配器
    this.adapters.delete(channelType);
    this.updateSupportedChannels();

    this.logDebug('Unregistered adapter', {
      channelType,
      wasBuiltin: registration.isBuiltin,
    });
  }

  /**
   * 重置为默认状态
   * - 移除所有自定义适配器
   * - 重新注册所有内置适配器
   * - 用于测试或重置工厂状态
   *
   * @example
   * ```typescript
   * // 在测试中重置工厂状态
   * AdapterFactory.reset();
   * ```
   */
  reset(): void {
    this.logDebug('Resetting adapter factory to default state');

    // 清空所有适配器
    this.adapters.clear();

    // 重新注册默认适配器
    this.registerDefaultAdapters();
  }
}

// 导出单例实例
export const AdapterFactory = new AdapterFactoryImpl();
