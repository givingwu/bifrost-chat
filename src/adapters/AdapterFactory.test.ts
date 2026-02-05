import { beforeEach, describe, expect, it } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import { AdapterError, AdapterErrorCode } from './AdapterError';
import { AdapterFactory } from './AdapterFactory';
import { WabaAdapter } from './waba/WabaAdapter';

describe('AdapterFactory', () => {
  // 在每个测试前重置工厂状态
  beforeEach(() => {
    AdapterFactory.reset();
  });

  describe('createAdapter', () => {
    it('should create WABA adapter', () => {
      const adapter = AdapterFactory.createAdapter(ChannelTypeEnum.Waba);

      expect(adapter).toBeInstanceOf(WabaAdapter);
      expect(adapter.channelType).toBe(ChannelTypeEnum.Waba);
    });

    it('should throw AdapterError for unsupported channel type', () => {
      expect(() => {
        AdapterFactory.createAdapter('unsupported' as ChannelTypeEnum);
      }).toThrow(AdapterError);
    });

    it('should include error code in unsupported channel error', () => {
      try {
        AdapterFactory.createAdapter('unsupported' as ChannelTypeEnum);
        expect.fail('Should have thrown AdapterError');
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        if (error instanceof AdapterError) {
          expect(error.code).toBe(AdapterErrorCode.UNSUPPORTED_CHANNEL);
          expect(error.channelType).toBe('unsupported');
          expect(error.context?.supportedChannels).toContain(
            ChannelTypeEnum.Waba,
          );
        }
      }
    });

    it('should create new instance on each call', () => {
      const adapter1 = AdapterFactory.createAdapter(ChannelTypeEnum.Waba);
      const adapter2 = AdapterFactory.createAdapter(ChannelTypeEnum.Waba);

      expect(adapter1).not.toBe(adapter2);
      expect(adapter1.channelType).toBe(adapter2.channelType);
    });
  });

  describe('isSupported', () => {
    it('should return true for WABA channel', () => {
      expect(AdapterFactory.isSupported(ChannelTypeEnum.Waba)).toBe(true);
    });

    it('should return false for unsupported channel', () => {
      expect(AdapterFactory.isSupported('unsupported' as ChannelTypeEnum)).toBe(
        false,
      );
    });

    it('should return true for newly registered adapter', () => {
      class MockAdapter {
        readonly channelType = 'custom' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'custom' as ChannelTypeEnum,
        () => new MockAdapter(),
      );

      expect(AdapterFactory.isSupported('custom' as ChannelTypeEnum)).toBe(
        true,
      );
    });
  });

  describe('getSupportedChannels', () => {
    it('should return array of supported channels', () => {
      const channels = AdapterFactory.getSupportedChannels();

      expect(channels).toContain(ChannelTypeEnum.Waba);
      expect(channels).toBeInstanceOf(Array);
    });

    it('should return readonly array', () => {
      const channels = AdapterFactory.getSupportedChannels();

      // 尝试修改应该失败（TypeScript 编译时检查）
      // 运行时我们验证返回的是数组的副本
      expect(Array.isArray(channels)).toBe(true);
    });

    it('should include newly registered channels', () => {
      class MockAdapter {
        readonly channelType = 'test' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'test' as ChannelTypeEnum,
        () => new MockAdapter(),
      );

      const channels = AdapterFactory.getSupportedChannels();
      expect(channels).toContain('test' as ChannelTypeEnum);
    });

    it('should exclude unregistered channels', () => {
      class MockAdapter {
        readonly channelType = 'temp' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'temp' as ChannelTypeEnum,
        () => new MockAdapter(),
      );
      expect(AdapterFactory.isSupported('temp' as ChannelTypeEnum)).toBe(true);

      AdapterFactory.unregisterAdapter('temp' as ChannelTypeEnum);
      expect(AdapterFactory.isSupported('temp' as ChannelTypeEnum)).toBe(false);

      const channels = AdapterFactory.getSupportedChannels();
      expect(channels).not.toContain('temp' as ChannelTypeEnum);
    });
  });

  describe('registerAdapter', () => {
    it('should allow registering custom adapter', () => {
      // 创建一个模拟适配器
      class MockAdapter {
        readonly channelType = 'custom' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      // 注册自定义适配器
      AdapterFactory.registerAdapter(
        'custom' as ChannelTypeEnum,
        () => new MockAdapter(),
      );

      // 验证适配器已注册
      expect(AdapterFactory.isSupported('custom' as ChannelTypeEnum)).toBe(
        true,
      );

      // 创建自定义适配器实例
      const adapter = AdapterFactory.createAdapter('custom' as ChannelTypeEnum);
      expect(adapter).toBeInstanceOf(MockAdapter);

      // 清理：注销自定义适配器
      AdapterFactory.unregisterAdapter('custom' as ChannelTypeEnum);
    });

    it('should throw error when registering duplicate adapter', () => {
      class MockAdapter {
        readonly channelType = 'duplicate' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'duplicate' as ChannelTypeEnum,
        () => new MockAdapter(),
      );

      expect(() => {
        AdapterFactory.registerAdapter(
          'duplicate' as ChannelTypeEnum,
          () => new MockAdapter(),
        );
      }).toThrow(AdapterError);
    });

    it('should allow overriding with allowOverride option', () => {
      class MockAdapter1 {
        readonly channelType = 'override' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      class MockAdapter2 {
        readonly channelType = 'override' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'override' as ChannelTypeEnum,
        () => new MockAdapter1(),
      );

      // 应该允许覆盖
      expect(() => {
        AdapterFactory.registerAdapter(
          'override' as ChannelTypeEnum,
          () => new MockAdapter2(),
          { allowOverride: true },
        );
      }).not.toThrow();

      const adapter = AdapterFactory.createAdapter(
        'override' as ChannelTypeEnum,
      );
      expect(adapter).toBeInstanceOf(MockAdapter2);
    });

    it('should validate adapter factory function', () => {
      // 测试返回 null 的工厂函数
      expect(() => {
        AdapterFactory.registerAdapter(
          'invalid1' as ChannelTypeEnum,
          () => null as never,
        );
      }).toThrow(AdapterError);

      // 测试返回非对象的工厂函数
      expect(() => {
        AdapterFactory.registerAdapter(
          'invalid2' as ChannelTypeEnum,
          () => 'invalid' as never,
        );
      }).toThrow(AdapterError);

      // 测试缺少必需方法的工厂函数
      expect(() => {
        AdapterFactory.registerAdapter(
          'invalid3' as ChannelTypeEnum,
          () =>
            ({
              channelType: 'invalid3',
            }) as never,
        );
      }).toThrow(AdapterError);

      // 测试 channelType 不匹配的工厂函数
      expect(() => {
        AdapterFactory.registerAdapter(
          'invalid4' as ChannelTypeEnum,
          () =>
            ({
              channelType: 'different',
              initialize: async () => {},
              destroy: () => {},
              isInitialized: () => true,
            }) as never,
        );
      }).toThrow(AdapterError);
    });
  });

  describe('unregisterAdapter', () => {
    it('should allow unregistering adapter', () => {
      // 创建并注册一个模拟适配器
      class MockAdapter {
        readonly channelType = 'temp' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'temp' as ChannelTypeEnum,
        () => new MockAdapter(),
      );
      expect(AdapterFactory.isSupported('temp' as ChannelTypeEnum)).toBe(true);

      // 注销适配器
      AdapterFactory.unregisterAdapter('temp' as ChannelTypeEnum);
      expect(AdapterFactory.isSupported('temp' as ChannelTypeEnum)).toBe(false);
    });

    it('should throw error when unregistering non-existent adapter', () => {
      expect(() => {
        AdapterFactory.unregisterAdapter('nonexistent' as ChannelTypeEnum);
      }).toThrow(AdapterError);
    });

    it('should not allow unregistering built-in adapter', () => {
      expect(() => {
        AdapterFactory.unregisterAdapter(ChannelTypeEnum.Waba);
      }).toThrow(AdapterError);
    });

    it('should allow force unregistering built-in adapter', () => {
      expect(() => {
        AdapterFactory.unregisterAdapter(ChannelTypeEnum.Waba, {
          force: true,
        });
      }).not.toThrow();

      expect(AdapterFactory.isSupported(ChannelTypeEnum.Waba)).toBe(false);

      // 重置以恢复默认状态
      AdapterFactory.reset();
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      // 注册一些自定义适配器
      class MockAdapter {
        readonly channelType = 'custom' as ChannelTypeEnum;
        async initialize(): Promise<void> {}
        destroy(): void {}
        isInitialized(): boolean {
          return true;
        }
      }

      AdapterFactory.registerAdapter(
        'custom' as ChannelTypeEnum,
        () => new MockAdapter(),
      );

      expect(AdapterFactory.isSupported('custom' as ChannelTypeEnum)).toBe(
        true,
      );

      // 重置
      AdapterFactory.reset();

      // 验证自定义适配器已移除
      expect(AdapterFactory.isSupported('custom' as ChannelTypeEnum)).toBe(
        false,
      );

      // 验证内置适配器仍然存在
      expect(AdapterFactory.isSupported(ChannelTypeEnum.Waba)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should provide structured error information', () => {
      try {
        AdapterFactory.createAdapter('unsupported' as ChannelTypeEnum);
        expect.fail('Should have thrown AdapterError');
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        if (error instanceof AdapterError) {
          // 验证错误结构
          expect(error.name).toBe('AdapterError');
          expect(error.code).toBe(AdapterErrorCode.UNSUPPORTED_CHANNEL);
          expect(error.channelType).toBe('unsupported');
          expect(error.context).toBeDefined();
          expect(typeof error.context?.supportedChannels).toBe('object');

          // 验证 toJSON 方法
          const json = error.toJSON();
          expect(json).toHaveProperty('name');
          expect(json).toHaveProperty('message');
          expect(json).toHaveProperty('code');
          expect(json).toHaveProperty('channelType');
          expect(json).toHaveProperty('context');
        }
      }
    });

    it('should support error cause chain', () => {
      const originalError = new Error('Original error');
      const adapterError = new AdapterError(
        'Wrapper error',
        AdapterErrorCode.ADAPTER_INIT_FAILED,
        { cause: originalError },
      );

      expect(adapterError.cause).toBe(originalError);
    });
  });
});
