import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/utils/logger.util';
import { PendingMessageTracker } from './pending-message-tracker.service';

describe('PendingMessageTracker', () => {
  let tracker: PendingMessageTracker;

  beforeEach(() => {
    // 创建新实例，禁用自动清理
    tracker = new PendingMessageTracker({
      enableCleanup: false,
      maxAge: 1000, // 1 秒，便于测试
    });
  });

  afterEach(() => {
    tracker.destroy();
  });

  describe('register', () => {
    it('应该注册 messageId → conversationId 映射', () => {
      tracker.register('msg-1', 'conv-1');

      expect(tracker.get('msg-1')).toBe('conv-1');
    });

    it('应该覆盖已存在的映射', () => {
      tracker.register('msg-1', 'conv-1');
      tracker.register('msg-1', 'conv-2');

      expect(tracker.get('msg-1')).toBe('conv-2');
    });

    it('当 messageId 为空时不应该注册', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      tracker.register('', 'conv-1');

      expect(tracker.get('')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('当 conversationId 为空时不应该注册', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

      tracker.register('msg-1', '');

      expect(tracker.get('msg-1')).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('应该返回已注册的 conversationId', () => {
      tracker.register('msg-1', 'conv-1');

      expect(tracker.get('msg-1')).toBe('conv-1');
    });

    it('当映射不存在时应该返回 undefined', () => {
      expect(tracker.get('non-existent')).toBeUndefined();
    });

    it('当映射已过期时应该返回 undefined 并删除映射', () => {
      tracker.register('msg-1', 'conv-1');

      // 等待过期
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(tracker.get('msg-1')).toBeUndefined();
          expect(tracker.has('msg-1')).toBe(false);
          resolve();
        }, 1100);
      });
    });
  });

  describe('remove', () => {
    it('应该移除已存在的映射', () => {
      tracker.register('msg-1', 'conv-1');

      const result = tracker.remove('msg-1');

      expect(result).toBe(true);
      expect(tracker.get('msg-1')).toBeUndefined();
    });

    it('当映射不存在时应该返回 false', () => {
      const result = tracker.remove('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('当映射存在时应该返回 true', () => {
      tracker.register('msg-1', 'conv-1');

      expect(tracker.has('msg-1')).toBe(true);
    });

    it('当映射不存在时应该返回 false', () => {
      expect(tracker.has('non-existent')).toBe(false);
    });
  });

  describe('size', () => {
    it('应该返回当前映射数量', () => {
      expect(tracker.size()).toBe(0);

      tracker.register('msg-1', 'conv-1');
      expect(tracker.size()).toBe(1);

      tracker.register('msg-2', 'conv-2');
      expect(tracker.size()).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('应该清理过期的映射', () => {
      tracker.register('msg-1', 'conv-1');

      // 等待过期
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cleanedCount = tracker.cleanup();

          expect(cleanedCount).toBe(1);
          expect(tracker.size()).toBe(0);
          resolve();
        }, 1100);
      });
    });

    it('不应该清理未过期的映射', () => {
      tracker.register('msg-1', 'conv-1');

      const cleanedCount = tracker.cleanup();

      expect(cleanedCount).toBe(0);
      expect(tracker.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('应该清空所有映射', () => {
      tracker.register('msg-1', 'conv-1');
      tracker.register('msg-2', 'conv-2');

      tracker.clear();

      expect(tracker.size()).toBe(0);
    });
  });

  describe('destroy', () => {
    it('应该停止清理定时器并清空映射', () => {
      const cleanupTracker = new PendingMessageTracker({
        enableCleanup: true,
        cleanupInterval: 100,
      });

      cleanupTracker.register('msg-1', 'conv-1');
      cleanupTracker.destroy();

      expect(cleanupTracker.size()).toBe(0);
    });
  });

  describe('getAll', () => {
    it('应该返回映射表的快照', () => {
      tracker.register('msg-1', 'conv-1');
      tracker.register('msg-2', 'conv-2');

      const all = tracker.getAll();

      expect(all.size).toBe(2);
      expect(all.get('msg-1')?.conversationId).toBe('conv-1');
      expect(all.get('msg-2')?.conversationId).toBe('conv-2');
    });
  });
});

describe('PendingMessageTracker 全局单例', () => {
  it('pendingMessageTracker 应该是 PendingMessageTracker 的实例', async () => {
    const { pendingMessageTracker } = await import(
      './pending-message-tracker.service'
    );

    expect(pendingMessageTracker).toBeInstanceOf(PendingMessageTracker);
  });
});
