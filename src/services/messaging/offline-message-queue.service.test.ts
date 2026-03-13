import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelTypeEnum } from '@/interfaces/channel.interface';
import {
  MessageDirectionEnum,
  MessagePriorityEnum,
  MessageTypeEnum,
} from '@/interfaces/message.interface';
import type { OfflineMessage } from '@/interfaces/offline-message.interface';
import type { IStorage } from '@/interfaces/storage.interface';
import { createStorageHelper } from '@/utils/storage.util';
import { OfflineMessageQueueService } from './offline-message-queue.service';

vi.mock('@/utils/storage.util', () => ({
  createStorageHelper: vi.fn(),
}));

function createOfflineMessage(id: string): OfflineMessage {
  return {
    id,
    conversationId: 'conv-1',
    sendParams: { content: 'hello' },
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
    priority: MessagePriorityEnum.Normal,
    message: {
      conversationId: 'conv-1',
      direction: MessageDirectionEnum.Outgoing,
      channelType: ChannelTypeEnum.WhatsApp,
      timestamp: Date.now(),
      type: MessageTypeEnum.Text,
      content: { text: 'hello' },
      sender: { app: 'fox', pin: '10001' },
      receiver: { app: 'fox', pin: '10002' },
    },
  };
}

function createMockStorage(initialMessages: OfflineMessage[] = []): IStorage & {
  getAll: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
} {
  let messages = [...initialMessages];

  return {
    open: vi.fn(async () => {}),
    close: vi.fn(() => {}),
    add: vi.fn(async (_storeName: string, data: OfflineMessage) => {
      messages.push(data);
      return data.id;
    }),
    get: vi.fn(async (_storeName: string, key: string) => {
      return messages.find((message) => message.id === key) ?? null;
    }),
    put: vi.fn(async (_storeName: string, data: OfflineMessage) => {
      messages = messages.map((message) =>
        message.id === data.id ? data : message,
      );
    }),
    delete: vi.fn(async (_storeName: string, key: string) => {
      messages = messages.filter((message) => message.id !== key);
    }),
    getAll: vi.fn(async () => [...messages]),
    getByIndex: vi.fn(
      async (_storeName: string, indexName: string, value: IDBValidKey) => {
        if (indexName !== 'conversationId') {
          return [];
        }

        return messages.filter((message) => message.conversationId === value);
      },
    ),
    clear: vi.fn(async () => {
      messages = [];
    }),
    count: vi.fn(async () => messages.length),
    getStorageType: vi.fn(() => 'indexeddb'),
  };
}

describe('OfflineMessageQueueService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('订阅者抛错时不应影响其他订阅者', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
        return undefined;
      });
    const storage = createMockStorage();
    vi.mocked(createStorageHelper).mockResolvedValue(storage);
    const service = new OfflineMessageQueueService({
      enabled: true,
      messageExpiration: 60_000,
    });
    let shouldThrow = false;
    const stableSubscriber = vi.fn();

    await service.initialize();

    service.subscribe(() => {
      if (shouldThrow) {
        throw new Error('boom');
      }
    });
    service.subscribe(stableSubscriber);

    shouldThrow = true;
    await service.enqueue(createOfflineMessage('offline-1'));

    expect(stableSubscriber).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'offline-1' }),
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OfflineMessageQueueService] Subscriber callback failed:',
      expect.any(Error),
    );

    service.destroy();
  });

  it('首次订阅立即回放抛错时不应残留订阅者', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
        return undefined;
      });
    const storage = createMockStorage([createOfflineMessage('offline-1')]);
    vi.mocked(createStorageHelper).mockResolvedValue(storage);
    const service = new OfflineMessageQueueService({
      enabled: true,
      messageExpiration: 60_000,
    });
    const throwingSubscriber = vi.fn(() => {
      throw new Error('initial replay failed');
    });
    const stableSubscriber = vi.fn();

    await service.initialize();

    expect(() => service.subscribe(throwingSubscriber)).toThrow(
      'initial replay failed',
    );

    service.subscribe(stableSubscriber);
    await service.enqueue(createOfflineMessage('offline-2'));

    expect(throwingSubscriber).toHaveBeenCalledTimes(1);
    expect(stableSubscriber).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[OfflineMessageQueueService] Subscriber callback failed:',
      expect.any(Error),
    );

    service.destroy();
  });

  it('destroy 后应停止 cleanup timer 并清空订阅者', async () => {
    vi.useFakeTimers();
    const storage = createMockStorage();
    vi.mocked(createStorageHelper).mockResolvedValue(storage);
    const service = new OfflineMessageQueueService({
      enabled: true,
      messageExpiration: 60_000,
    });
    const subscriber = vi.fn();

    await service.initialize();
    service.subscribe(subscriber);

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    service.destroy();

    expect(storage.close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);

    await service.enqueue(createOfflineMessage('offline-3'));
    await vi.runAllTimersAsync();

    expect(storage.getAll).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
