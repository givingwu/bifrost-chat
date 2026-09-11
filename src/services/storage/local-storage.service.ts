import type { IndexedDBConfig, IStorage } from '@/interfaces/storage.interface';
import { MessageBuilder } from '@/services/messaging/message-builder.service';
import { IndexedDBError } from './indexed-db.service';

/**
 * LocalStorage 辅助类
 * @description
 * 当 IndexedDB 不可用时的 fallback 实现
 * 注意：LocalStorage 不支持索引查询，getByIndex 会返回空数组
 */
export class LocalStorageImpl implements IStorage {
  private prefix: string;
  private initialized = false;

  constructor(config: IndexedDBConfig) {
    this.prefix = `${config.dbName}_`;
  }

  /**
   * 生成存储键
   */
  private getStoreKey(storeName: string): string {
    return `${this.prefix}${storeName}`;
  }

  /**
   * 初始化存储
   */
  async open(): Promise<void> {
    this.initialized = true;
    console.info('[LocalStorageHelper] Initialized');
  }

  /**
   * 关闭存储
   */
  close(): void {
    this.initialized = false;
  }

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<string> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    const items = this.getItems<T>(storeKey);

    // 获取主键值
    const keyPath = this.getKeyPath(data);
    const key = String(
      data[keyPath as keyof T] ?? MessageBuilder.generateUniqueId(),
    );

    // 检查是否已存在
    if (items.some((item) => String(item[keyPath as keyof T]) === key)) {
      throw new IndexedDBError(
        `Item with key ${key} already exists`,
        'ADD_ERROR',
      );
    }

    items.push(data);
    this.setItems(storeKey, items);

    return key;
  }

  /**
   * 获取单条数据
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    const items = this.getItems<T>(storeKey);

    return (
      items.find((item) => {
        const keyPath = this.getKeyPath(item);
        return String(item[keyPath as keyof T]) === key;
      }) ?? null
    );
  }

  /**
   * 更新数据
   */
  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    const items = this.getItems<T>(storeKey);

    const keyPath = this.getKeyPath(data);
    const key = String(data[keyPath as keyof T]);

    const index = items.findIndex((item) => {
      return String(item[keyPath as keyof T]) === key;
    });

    if (index >= 0) {
      items[index] = data;
    } else {
      items.push(data);
    }

    this.setItems(storeKey, items);
  }

  /**
   * 删除数据
   */
  async delete<T>(storeName: string, key: string): Promise<void> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    const items = this.getItems<T>(storeKey);

    const filtered = items.filter((item) => {
      const keyPath = this.getKeyPath(item);
      return String(item[keyPath as keyof T]) !== key;
    });

    this.setItems(storeKey, filtered);
  }

  /**
   * 获取所有数据
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    return this.getItems<T>(storeKey);
  }

  /**
   * 使用索引查询数据（LocalStorage 不支持）
   */
  async getByIndex<T>(
    _storeName: string,
    indexName: string,
    _value: IDBValidKey,
  ): Promise<T[]> {
    console.warn(
      `[LocalStorageHelper] Index queries not supported, returning empty array for index "${indexName}"`,
    );
    return [];
  }

  /**
   * 清空对象存储
   */
  async clear(storeName: string): Promise<void> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    localStorage.removeItem(storeKey);
  }

  /**
   * 统计数据数量
   */
  async count(storeName: string): Promise<number> {
    if (!this.initialized) {
      await this.open();
    }

    const storeKey = this.getStoreKey(storeName);
    return this.getItems(storeKey).length;
  }

  /**
   * 获取存储类型
   */
  getStorageType(): 'localstorage' {
    return 'localstorage';
  }

  /**
   * 从 LocalStorage 获取所有项目
   */
  private getItems<T>(storeKey: string): T[] {
    const data = localStorage.getItem(storeKey);
    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data) as T[];
    } catch {
      console.error(
        `[LocalStorageHelper] Failed to parse data for ${storeKey}`,
      );
      return [];
    }
  }

  /**
   * 保存项目到 LocalStorage
   */
  private setItems<T>(storeKey: string, items: T[]): void {
    try {
      localStorage.setItem(storeKey, JSON.stringify(items));
    } catch (error) {
      throw new IndexedDBError(
        `Failed to save data to LocalStorage: ${error}`,
        'STORAGE_ERROR',
      );
    }
  }

  /**
   * 获取对象的主键路径值
   */
  private getKeyPath<T>(data: T): string {
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length === 1) {
        return keys[0];
      }
      if ('id' in data) {
        return 'id';
      }
    }
    return 'id';
  }
}
